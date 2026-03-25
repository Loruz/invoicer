"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Square,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  List,
  FolderKanban,
} from "lucide-react";
import {
  formatDurationShort,
  calculateElapsed,
  formatDuration,
} from "@invoicer/shared";
import type { TimeEntryWithProject } from "@invoicer/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { TimeEntryDialog } from "./time-entry-dialog";
import { useActiveProjects } from "@/hooks/use-projects";
import { useActiveTimer } from "@/hooks/use-active-timer";
import { useTimeEntries } from "@/hooks/use-time-entries";

// ─── Types ──────────────────────────────────────────────
type ViewMode = "list" | "calendar";

type DayGroup = {
  date: string;
  label: string;
  entries: TimeEntryWithProject[];
  totalSeconds: number;
};

// ─── Calendar helpers ───────────────────────────────────
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDayOfWeek);
  const weeks: Date[][] = [];
  const current = new Date(startDate);
  while (
    weeks.length < 6 &&
    (current <= lastDay || weeks.length < 4 || current.getDay() !== 1)
  ) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && current.getDay() === 1) break;
  }
  return weeks;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function fmtTimer(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey(date) === dateKey(today)) return "Today";
  if (dateKey(date) === dateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// ─── Main Component ─────────────────────────────────────
export function TimeTrackingPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [timerProjectId, setTimerProjectId] = useState<string | null>(null);
  const [timerDescription, setTimerDescription] = useState("");
  const [timerBillable, setTimerBillable] = useState(true);
  const [timerLoading, setTimerLoading] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    entries: TimeEntryWithProject[];
    totalSeconds: number;
  } | null>(null);

  // Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithProject | null>(null);

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const weeks = getMonthGrid(calendarYear, calendarMonth);

  // ─── Data hooks ───────────────────────────────────────
  const { data: projects = [] } = useActiveProjects();
  const { data: activeEntry } = useActiveTimer();

  // Compute date range for time entries query
  const entriesRange = useMemo(() => {
    if (viewMode === "calendar") {
      const allDates = weeks.flat();
      const calTo = new Date(allDates[allDates.length - 1]);
      calTo.setDate(calTo.getDate() + 1);
      return { from: allDates[0].toISOString(), to: calTo.toISOString() };
    }
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString() };
  }, [viewMode, calendarYear, calendarMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: entries = [], isLoading: loading } = useTimeEntries(entriesRange);

  // ─── Tick elapsed ───────────────────────────────────
  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }
    setElapsed(calculateElapsed(activeEntry.startTime));
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(activeEntry.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const invalidateTimerAndEntries = () => {
    queryClient.invalidateQueries({ queryKey: ["timer"] });
    queryClient.invalidateQueries({ queryKey: ["time-entries"] });
  };

  // ─── Timer actions ──────────────────────────────────
  const handleStart = async () => {
    if (!timerProjectId) return;
    setTimerLoading(true);
    try {
      const res = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: timerProjectId,
          description: timerDescription || undefined,
          billable: timerBillable,
        }),
      });
      if (res.ok) {
        invalidateTimerAndEntries();
        setTimerDescription("");
        setTimerProjectId(null);
      }
    } catch {}
    setTimerLoading(false);
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    setTimerLoading(true);
    try {
      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: activeEntry.id }),
      });
      if (res.ok) {
        invalidateTimerAndEntries();
      }
    } catch {}
    setTimerLoading(false);
  };

  // ─── Entry actions ──────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      }
    } catch {}
  };

  const handleEdit = (entry: TimeEntryWithProject) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  // ─── Group entries by day ───────────────────────────
  const dayGroups: DayGroup[] = useMemo(() => {
    const grouped: Record<string, TimeEntryWithProject[]> = {};
    for (const entry of entries) {
      const key = dateKey(new Date(entry.startTime));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayEntries]) => ({
        date,
        label: formatDayLabel(date),
        entries: dayEntries,
        totalSeconds: dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0),
      }));
  }, [entries]);

  // ─── Stats ──────────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const todayStr = dateKey(now);

  const monthTotalSeconds = entries
    .filter((e) => new Date(e.startTime) >= monthStart)
    .reduce((s, e) => s + (e.duration ?? 0), 0);
  const weekTotalSeconds = entries
    .filter((e) => new Date(e.startTime) >= startOfWeek)
    .reduce((s, e) => s + (e.duration ?? 0), 0);
  const todayTotalSeconds = entries
    .filter((e) => dateKey(new Date(e.startTime)) === todayStr)
    .reduce((s, e) => s + (e.duration ?? 0), 0);
  const totalSeconds = entries.reduce((s, e) => s + (e.duration ?? 0), 0);
  const billedSeconds = entries
    .filter((e) => (e as any).invoice != null)
    .reduce((s, e) => s + (e.duration ?? 0), 0);
  const unbilledSeconds = totalSeconds - billedSeconds;

  // ─── Calendar helpers ───────────────────────────────
  const entriesByDate: Record<string, TimeEntryWithProject[]> = {};
  for (const entry of entries) {
    const key = dateKey(new Date(entry.startTime));
    if (!entriesByDate[key]) entriesByDate[key] = [];
    entriesByDate[key].push(entry);
  }

  const monthLabel = calendarDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Time Tracking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and review your billable hours.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Manual Entry
          </button>
          <div className="flex items-center rounded-lg border border-[#E8ECF1] bg-white">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-l-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 rounded-r-lg px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* ─── Timer Bar ─────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-[#E8ECF1] bg-white p-4 shadow-sm">
        {activeEntry ? (
          /* Running timer */
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="size-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-sm font-medium text-slate-900 truncate">
                {activeEntry.description || activeEntry.project.name}
              </span>
              {activeEntry.description && (
                <span className="text-sm text-slate-400 truncate">
                  {activeEntry.project.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-mono text-lg font-semibold tabular-nums text-slate-900">
                {fmtTimer(elapsed)}
              </span>
              <button
                onClick={handleStop}
                disabled={timerLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            </div>
          </div>
        ) : (
          /* Timer input */
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={timerDescription}
              onChange={(e) => setTimerDescription(e.target.value)}
              placeholder="What are you working on?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && timerProjectId) handleStart();
              }}
              className="flex-1 text-sm text-slate-900 placeholder-slate-400 outline-none bg-transparent"
            />
            <div className="flex items-center gap-2 shrink-0">
              {/* Project selector */}
              {projects.length === 0 ? (
                <Link
                  href="/projects/new"
                  className="rounded-lg border border-dashed border-[#E8ECF1] px-3 py-2 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                  + Add project
                </Link>
              ) : (
                <Select value={timerProjectId} onValueChange={(val) => setTimerProjectId(val)}>
                  <SelectTrigger className="rounded-lg border border-[#E8ECF1] bg-white text-sm max-w-[180px]">
                    <SelectValue placeholder="Project">
                      {(value) => value ? projects.find((p) => p.id === value)?.name ?? value : "Project"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* Billable toggle */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setTimerBillable(!timerBillable)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        timerBillable
                          ? "border-blue-200 bg-blue-50 text-blue-600"
                          : "border-[#E8ECF1] text-slate-300 hover:text-slate-500"
                      }`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                  }
                />
                <TooltipContent>{timerBillable ? "Billable" : "Non-billable"}</TooltipContent>
              </Tooltip>
              {/* Start button */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={handleStart}
                      disabled={!timerProjectId || timerLoading}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F766E] text-white hover:bg-[#0d6960] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                  }
                />
                {!timerProjectId && (
                  <TooltipContent>Select a project first</TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* ─── Stats Cards ───────────────────────────────── */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5 transition-shadow hover:shadow-sm">
          <p className="text-sm text-slate-500">This Month</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fmtDuration(monthTotalSeconds)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5 transition-shadow hover:shadow-sm">
          <p className="text-sm text-slate-500">This Week</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fmtDuration(weekTotalSeconds)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5 transition-shadow hover:shadow-sm">
          <p className="text-sm text-slate-500">Today</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fmtDuration(todayTotalSeconds)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5 transition-shadow hover:shadow-sm">
          <p className="text-sm text-slate-500">Unbilled</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {fmtDuration(unbilledSeconds)}
          </p>
          {billedSeconds > 0 && (
            <p className="mt-0.5 text-xs text-emerald-600">
              {fmtDuration(billedSeconds)} billed
            </p>
          )}
        </div>
      </div>

      {/* ─── List View ─────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {loading ? (
            <div className="rounded-xl border border-[#E8ECF1] bg-white py-16 text-center text-sm text-slate-400">
              Loading entries...
            </div>
          ) : dayGroups.length === 0 ? (
            <div className="rounded-xl border border-[#E8ECF1] bg-white py-16 text-center">
              {projects.length === 0 ? (
                <>
                  <FolderKanban className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-500">
                    Create a project to start tracking time.
                  </p>
                  <Link
                    href="/projects/new"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0F3D5F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Project
                  </Link>
                </>
              ) : (
                <>
                  <Clock className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-sm text-slate-500">No time entries yet.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Start a timer above or add a manual entry.
                  </p>
                </>
              )}
            </div>
          ) : (
            dayGroups.map((group) => (
              <div
                key={group.date}
                className="rounded-xl border border-[#E8ECF1] bg-white overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between border-b border-[#E8ECF1] bg-slate-50/70 px-5 py-3">
                  <span className="text-sm font-semibold text-slate-700">
                    {group.label}
                  </span>
                  <span className="text-sm font-medium text-slate-500 tabular-nums">
                    {fmtDuration(group.totalSeconds)}
                  </span>
                </div>
                {/* Entries */}
                <div className="divide-y divide-[#E8ECF1]">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50/50"
                    >
                      {/* Description + project */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="size-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: entry.project.color ?? "#94a3b8",
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-slate-900">
                            {entry.description || (
                              <span className="italic text-slate-400">
                                No description
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      {/* Project tag */}
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {entry.project.name}
                      </span>
                      {/* Billed/Billable indicator */}
                      {(entry as any).invoice ? (
                        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          {(entry as any).invoice.invoiceNumber}
                        </span>
                      ) : entry.billable ? (
                        <DollarSign className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      ) : null}
                      {/* Duration */}
                      <span className="shrink-0 w-20 text-right font-mono text-sm tabular-nums text-slate-700">
                        {entry.duration != null
                          ? formatDurationShort(entry.duration)
                          : "Running..."}
                      </span>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          aria-label="Edit entry"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Calendar View ─────────────────────────────── */}
      {viewMode === "calendar" && (
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
          {/* Calendar nav */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                {monthLabel}
              </h2>
              <button
                onClick={() =>
                  setCalendarDate(
                    new Date(calendarYear, calendarMonth - 1, 1)
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8ECF1] hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={() =>
                  setCalendarDate(
                    new Date(calendarYear, calendarMonth + 1, 1)
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8ECF1] hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="ml-1 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="overflow-hidden rounded-lg border border-[#E8ECF1]">
            <div className="grid grid-cols-7 border-b border-[#E8ECF1] bg-slate-50">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-2.5 text-center text-xs font-semibold tracking-wider text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-400">
                Loading...
              </div>
            ) : (
              weeks.map((week, wi) => (
                <div
                  key={wi}
                  className="grid grid-cols-7 border-b border-[#E8ECF1] last:border-b-0"
                >
                  {week.map((date) => {
                    const key = dateKey(date);
                    const dayEntries = entriesByDate[key] ?? [];
                    const totalSec = dayEntries.reduce(
                      (sum, e) => sum + (e.duration ?? 0),
                      0
                    );
                    const isCurMonth = date.getMonth() === calendarMonth;
                    const today = isToday(date);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (dayEntries.length > 0)
                            setSelectedDay({
                              date,
                              entries: dayEntries,
                              totalSeconds: totalSec,
                            });
                        }}
                        className={`relative min-h-[80px] border-r border-[#E8ECF1] last:border-r-0 p-2 text-left transition-colors hover:bg-blue-50/30 ${
                          !isCurMonth ? "bg-slate-50/50" : ""
                        } ${today ? "bg-blue-50/50" : ""} ${
                          dayEntries.length > 0
                            ? "cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                            today
                              ? "bg-blue-600 text-white font-semibold"
                              : isCurMonth
                                ? "text-slate-700"
                                : "text-slate-300"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {totalSec > 0 && (
                          <div
                            className={`mt-1 rounded px-1 py-0.5 text-[10px] font-medium inline-block ${
                              today
                                ? "bg-amber-100 text-amber-700"
                                : totalSec >= 8 * 3600
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {formatDurationShort(totalSec)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── Calendar Day Detail Dialog ────────────────── */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay?.date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedDay.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <div
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: entry.project.color ?? "#6b7280",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {entry.project.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {entry.project.client.companyName}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-slate-400 mt-1">
                        {entry.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium whitespace-nowrap">
                    {entry.duration
                      ? formatDurationShort(entry.duration)
                      : "Running"}
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3 text-sm font-medium">
                <span>Total</span>
                <span>{formatDurationShort(selectedDay.totalSeconds)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Edit/Add Dialog ───────────────────────────── */}
      <TimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editingEntry}
        onSave={() => queryClient.invalidateQueries({ queryKey: ["time-entries"] })}
      />
    </div>
  );
}
