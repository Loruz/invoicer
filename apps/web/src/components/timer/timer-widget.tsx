"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { calculateElapsed, formatDuration } from "@invoicer/shared";
import type { TimeEntryWithProject } from "@invoicer/shared";

export function TimerWidget() {
  const [activeEntry, setActiveEntry] = useState<TimeEntryWithProject | null>(
    null
  );
  const [elapsed, setElapsed] = useState(0);

  const fetchActiveTimer = useCallback(async () => {
    try {
      const res = await fetch("/api/timer/active");
      if (res.ok) {
        const data = await res.json();
        setActiveEntry(data);
        if (data) {
          setElapsed(calculateElapsed(data.startTime));
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchActiveTimer();
    // Poll every 30s to stay in sync with the time tracking page
    const poll = setInterval(fetchActiveTimer, 30000);
    return () => clearInterval(poll);
  }, [fetchActiveTimer]);

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

  if (!activeEntry) {
    return (
      <Link
        href="/time"
        className="flex items-center gap-2 rounded-lg border border-[#E8ECF1] px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
      >
        <Clock className="h-4 w-4" />
        <span>No timer running</span>
      </Link>
    );
  }

  return (
    <Link
      href="/time"
      className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 px-3 py-1.5 hover:bg-green-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-slate-700 max-w-[160px] truncate">
          {activeEntry.project.name}
        </span>
      </div>
      <span className="font-mono text-sm tabular-nums text-slate-900 font-medium">
        {formatDuration(elapsed)}
      </span>
    </Link>
  );
}
