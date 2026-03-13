"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDurationShort } from "@invoicer/shared";

type TimeEntry = {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  project: {
    id: string;
    name: string;
    color: string | null;
    client: {
      companyName: string;
    };
  };
};

type DayData = {
  date: Date;
  isCurrentMonth: boolean;
  entries: TimeEntry[];
  totalSeconds: number;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Adjust so Monday = 0
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

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weeks = getMonthGrid(year, month);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const allDates = weeks.flat();
      const from = allDates[0];
      const to = allDates[allDates.length - 1];

      const toEnd = new Date(to);
      toEnd.setDate(toEnd.getDate() + 1);

      const params = new URLSearchParams({
        from: from.toISOString(),
        to: toEnd.toISOString(),
      });

      const res = await fetch(`/api/time-entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Group entries by date
  const entriesByDate: Record<string, TimeEntry[]> = {};
  for (const entry of entries) {
    const key = dateKey(new Date(entry.startTime));
    if (!entriesByDate[key]) entriesByDate[key] = [];
    entriesByDate[key].push(entry);
  }

  function getDayData(date: Date): DayData {
    const key = dateKey(date);
    const dayEntries = entriesByDate[key] ?? [];
    const totalSeconds = dayEntries.reduce(
      (sum, e) => sum + (e.duration ?? 0),
      0
    );
    return {
      date,
      isCurrentMonth: date.getMonth() === month,
      entries: dayEntries,
      totalSeconds,
    };
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const monthLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Collect unique project colors for a day
  function getProjectColors(dayData: DayData): string[] {
    const colors = new Set<string>();
    for (const entry of dayData.entries) {
      colors.add(entry.project.color ?? "#6b7280");
    }
    return [...colors].slice(0, 5);
  }

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{monthLabel}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading...
          </div>
        ) : (
          weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-b last:border-b-0"
            >
              {week.map((date) => {
                const dayData = getDayData(date);
                const colors = getProjectColors(dayData);
                const today = isToday(date);

                return (
                  <button
                    key={dateKey(date)}
                    type="button"
                    onClick={() => {
                      if (dayData.entries.length > 0) setSelectedDay(dayData);
                    }}
                    className={`relative min-h-[80px] border-r last:border-r-0 p-1.5 text-left transition-colors hover:bg-muted/50 ${
                      !dayData.isCurrentMonth ? "bg-muted/30" : ""
                    } ${dayData.entries.length > 0 ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        today
                          ? "bg-primary text-primary-foreground font-bold"
                          : dayData.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Project color dots */}
                    {colors.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {colors.map((color, i) => (
                          <div
                            key={i}
                            className="h-1.5 flex-1 min-w-1.5 max-w-6 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Total hours */}
                    {dayData.totalSeconds > 0 && (
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatDurationShort(dayData.totalSeconds)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </Card>

      {/* Day Detail Dialog */}
      <Dialog
        open={selectedDay !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? selectedDay.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : ""}
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
                    <div className="font-medium text-sm truncate">
                      {entry.project.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.project.client.companyName}
                    </div>
                    {entry.description && (
                      <div className="text-xs text-muted-foreground mt-1">
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
    </div>
  );
}
