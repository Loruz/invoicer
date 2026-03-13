"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectSelector } from "@/components/timer/project-selector";
import type { TimeEntryWithProject } from "@invoicer/shared";

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntryWithProject | null;
  onSave: () => void;
}

function toLocalDatetimeString(date: Date | string): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function TimeEntryDialog({
  open,
  onOpenChange,
  entry,
  onSave,
}: TimeEntryDialogProps) {
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [billable, setBillable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!entry;

  useEffect(() => {
    if (open) {
      if (entry) {
        setProjectId(entry.projectId);
        setDescription(entry.description ?? "");
        setStartTime(toLocalDatetimeString(entry.startTime));
        setEndTime(entry.endTime ? toLocalDatetimeString(entry.endTime) : "");
        setBillable(entry.billable);
      } else {
        setProjectId("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        setBillable(true);
      }
      setError("");
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        projectId,
        description: description || undefined,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        billable,
      };

      const url = isEditing
        ? `/api/time-entries/${entry.id}`
        : "/api/time-entries";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to save entry.");
        return;
      }

      onSave();
      onOpenChange(false);
    } catch {
      setError("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Time Entry" : "Add Manual Entry"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this time entry."
              : "Create a new time entry manually."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="project">Project</Label>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="billable"
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="billable">Billable</Label>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
