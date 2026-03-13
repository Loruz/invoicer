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

interface RecentEntry {
  id: string;
  description: string | null;
  startTime: string;
  duration: number | null;
  project: { name: string; color: string | null } | null;
}

export function useRecentEntries() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await apiFetch<RecentEntry[]>(
        "/api/time-entries?limit=5",
        token
      );
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      // Silently fail
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, refresh: load };
}
