import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/chrome-extension";
import { apiFetch } from "./api";
import type { Project, TimeEntry, TimeEntryWithProject } from "@invoicer/shared";

// ─── Active Timer ────────────────────────────────────────────────

interface ActiveTimer {
  id: string;
  projectId: string;
  description: string | null;
  startTime: string;
}

export function useTimer() {
  const { getToken } = useAuth();
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await apiFetch<ActiveTimer | null>(
        "/api/timer/active",
        token
      );
      setActiveTimer(data ?? null);
    } catch {
      // Silently fail - user might not have any active timer
    }
  }, [getToken]);

  useEffect(() => {
    fetchActiveTimer();

    // Poll every 30 seconds to stay in sync with web app
    const interval = setInterval(fetchActiveTimer, 30_000);
    return () => clearInterval(interval);
  }, [fetchActiveTimer]);

  const startTimer = useCallback(
    async (projectId: string, description: string | null) => {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const data = await apiFetch<ActiveTimer>(
          "/api/timer/start",
          token,
          {
            method: "POST",
            body: JSON.stringify({ projectId, description }),
          }
        );
        setActiveTimer(data);
      } finally {
        setIsLoading(false);
      }
    },
    [getToken]
  );

  const stopTimer = useCallback(async () => {
    if (!activeTimer) return;
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      await apiFetch("/api/timer/stop", token, {
        method: "POST",
      });
      setActiveTimer(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, activeTimer]);

  return { activeTimer, startTimer, stopTimer, isLoading, refresh: fetchActiveTimer };
}

// ─── Projects ────────────────────────────────────────────────────

export function useProjects() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        const data = await apiFetch<{ projects: Project[] }>(
          "/api/projects",
          token
        );
        if (!cancelled) {
          setProjects(data.projects);
        }
      } catch {
        // Silently fail
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  return { projects };
}

// ─── Recent Entries ──────────────────────────────────────────────

export interface RecentEntry {
  id: string;
  description: string | null;
  startTime: string;
  duration: number | null;
  project: { name: string; color: string | null } | null;
}

export interface DayGroup {
  date: string; // ISO date string "YYYY-MM-DD"
  label: string; // e.g. "Thu, 12 Mar"
  totalDuration: number; // seconds
  entries: RecentEntry[];
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust to Monday
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function groupEntriesByDay(entries: RecentEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>();

  for (const entry of entries) {
    const date = new Date(entry.startTime);
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!map.has(key)) {
      const label = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      map.set(key, { date: key, label, totalDuration: 0, entries: [] });
    }

    const group = map.get(key)!;
    group.entries.push(entry);
    group.totalDuration += entry.duration ?? 0;
  }

  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function useRecentEntries() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<RecentEntry[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [weekTotal, setWeekTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Fetch last 2 weeks of entries (enough for grouping + stats)
      const weekStart = getWeekStart();
      const from = weekStart.toISOString();

      const data = await apiFetch<RecentEntry[]>(
        `/api/time-entries?from=${encodeURIComponent(from)}`,
        token
      );
      const list = Array.isArray(data) ? data : [];
      setEntries(list);

      // Compute today total
      const todayStart = getTodayStart().getTime();
      let todaySecs = 0;
      let weekSecs = 0;
      for (const e of list) {
        const t = new Date(e.startTime).getTime();
        if (t >= todayStart) todaySecs += e.duration ?? 0;
        weekSecs += e.duration ?? 0;
      }
      setTodayTotal(todaySecs);
      setWeekTotal(weekSecs);
    } catch {
      // Silently fail
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const dayGroups = groupEntriesByDay(entries);

  return { entries, dayGroups, todayTotal, weekTotal, refresh: load };
}
