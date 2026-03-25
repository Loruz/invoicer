"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { calculateElapsed, formatDuration } from "@invoicer/shared";
import { useActiveTimer } from "@/hooks/use-active-timer";

export function TimerWidget() {
  const { data: activeEntry } = useActiveTimer();
  const [elapsed, setElapsed] = useState(0);

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
