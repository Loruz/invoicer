"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square } from "lucide-react";
import { calculateElapsed, formatDuration } from "@invoicer/shared";
import type { TimeEntryWithProject, ProjectWithClient } from "@invoicer/shared";

export function TimerWidget() {
  const [activeEntry, setActiveEntry] = useState<TimeEntryWithProject | null>(
    null
  );
  const [elapsed, setElapsed] = useState(0);
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch {
      // silently fail
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.filter((p: ProjectWithClient) => p.isActive));
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchActiveTimer();
    fetchProjects();
  }, [fetchActiveTimer, fetchProjects]);

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

  const handleStart = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/timer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId, billable: true }),
      });
      if (res.ok) {
        await fetchActiveTimer();
        setSelectedProjectId("");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeEntry) return;
    setLoading(true);
    try {
      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: activeEntry.id }),
      });
      if (res.ok) {
        setActiveEntry(null);
        setElapsed(0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (activeEntry) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="size-2 rounded-full bg-green-500 animate-pulse"
            aria-hidden
          />
          <span className="text-sm font-medium">
            {activeEntry.project.name}
          </span>
        </div>
        <span className="font-mono text-sm tabular-nums">
          {formatDuration(elapsed)}
        </span>
        <Button
          variant="destructive"
          size="icon-sm"
          onClick={handleStop}
          disabled={loading}
          aria-label="Stop timer"
        >
          <Square className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProjectId} onValueChange={(val) => val !== null && setSelectedProjectId(val)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
          {projects.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No projects
            </div>
          )}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        onClick={handleStart}
        disabled={!selectedProjectId || loading}
      >
        <Play className="size-3.5" data-icon="inline-start" />
        Start
      </Button>
    </div>
  );
}
