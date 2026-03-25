"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Check } from "lucide-react";
import { formatDurationShort } from "@invoicer/shared";
import type { TimeEntryWithProject } from "@invoicer/shared";

interface TimeEntryPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSelect: (entries: TimeEntryWithProject[]) => void;
}

type ProjectGroup = {
  projectId: string;
  projectName: string;
  projectColor: string | null;
  entries: TimeEntryWithProject[];
  totalSeconds: number;
};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TimeEntryPicker({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSelect,
}: TimeEntryPickerProps) {
  const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch unbilled entries when dialog opens
  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    setSelectedIds(new Set());
    fetch(`/api/time-entries?clientId=${clientId}&unbilled=true`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setEntries(data))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [open, clientId]);

  // Group entries by project
  const groups: ProjectGroup[] = useMemo(() => {
    const map = new Map<string, ProjectGroup>();
    for (const entry of entries) {
      const pid = entry.projectId;
      if (!map.has(pid)) {
        map.set(pid, {
          projectId: pid,
          projectName: entry.project.name,
          projectColor: entry.project.color,
          entries: [],
          totalSeconds: 0,
        });
      }
      const group = map.get(pid)!;
      group.entries.push(entry);
      group.totalSeconds += entry.duration ?? 0;
    }
    return Array.from(map.values());
  }, [entries]);

  const totalUnbilledSeconds = entries.reduce(
    (s, e) => s + (e.duration ?? 0),
    0
  );

  const selectedEntries = entries.filter((e) => selectedIds.has(e.id));
  const selectedSeconds = selectedEntries.reduce(
    (s, e) => s + (e.duration ?? 0),
    0
  );

  const allSelected =
    entries.length > 0 && selectedIds.size === entries.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  };

  const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProject = (projectId: string) => {
    const group = groups.find((g) => g.projectId === projectId);
    if (!group) return;
    const groupIds = group.entries.map((e) => e.id);
    const allGroupSelected = groupIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allGroupSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleAdd = () => {
    onSelect(selectedEntries);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Time Entries</DialogTitle>
          <DialogDescription>
            {clientName} — {entries.length} entries,{" "}
            {formatDurationShort(totalUnbilledSeconds)} unbilled
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-slate-400">
            <Clock className="mr-2 h-4 w-4 animate-pulse" />
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No unbilled time entries for this client.
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto -mx-6 px-6">
            {/* Select All */}
            <label className="flex items-center gap-3 py-2.5 border-b border-[#E8ECF1] cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="size-4 rounded border-slate-300 accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700">
                Select All
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {formatDurationShort(totalUnbilledSeconds)}
              </span>
            </label>

            {/* Groups */}
            {groups.map((group) => {
              const groupIds = group.entries.map((e) => e.id);
              const allGroupSelected = groupIds.every((id) =>
                selectedIds.has(id)
              );
              const someGroupSelected =
                !allGroupSelected &&
                groupIds.some((id) => selectedIds.has(id));

              return (
                <div key={group.projectId} className="mt-3">
                  {/* Project header */}
                  <label className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someGroupSelected;
                      }}
                      onChange={() => toggleProject(group.projectId)}
                      className="size-4 rounded border-slate-300 accent-blue-600"
                    />
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: group.projectColor ?? "#94a3b8",
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      {group.projectName}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {formatDurationShort(group.totalSeconds)}
                    </span>
                  </label>

                  {/* Entries */}
                  <div className="ml-4 border-l border-[#E8ECF1] pl-4">
                    {group.entries.map((entry) => (
                      <label
                        key={entry.id}
                        className="flex items-center gap-3 py-2 cursor-pointer hover:bg-slate-50/50 rounded -mx-2 px-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(entry.id)}
                          onChange={() => toggleEntry(entry.id)}
                          className="size-4 rounded border-slate-300 accent-blue-600"
                        />
                        <span className="text-xs text-slate-400 shrink-0 w-12">
                          {formatDate(entry.startTime)}
                        </span>
                        <span className="text-sm text-slate-700 truncate flex-1">
                          {entry.description || (
                            <span className="italic text-slate-400">
                              No description
                            </span>
                          )}
                        </span>
                        <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0">
                          {entry.duration
                            ? formatDurationShort(entry.duration)
                            : "—"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-sm text-slate-500">
            {selectedIds.size > 0 ? (
              <>
                <span className="font-medium text-slate-700">
                  {selectedIds.size}
                </span>{" "}
                selected ({formatDurationShort(selectedSeconds)})
              </>
            ) : (
              "No entries selected"
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
            >
              <Check className="size-4" data-icon="inline-start" />
              Add Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
