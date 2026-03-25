"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDurationShort } from "@invoicer/shared";
import { DatePicker } from "@/components/ui/date-picker";
import type { TimeEntryWithProject } from "@invoicer/shared";
import { TimeEntryDialog } from "./time-entry-dialog";

export function TimeEntriesPage() {
  const [entries, setEntries] = useState<TimeEntryWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryWithProject | null>(
    null
  );

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate.toISOString());
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        params.set("to", to.toISOString());
      }

      const url = `/api/time-entries${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  const handleEdit = (entry: TimeEntryWithProject) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleSave = () => {
    fetchEntries();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Time Entries</h1>
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          Add Manual Entry
        </Button>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <div className="grid gap-2">
          <Label>From</Label>
          <DatePicker value={fromDate} onChange={setFromDate} placeholder="Start date" />
        </div>
        <div className="grid gap-2">
          <Label>To</Label>
          <DatePicker value={toDate} onChange={setToDate} placeholder="End date" />
        </div>
        {(fromDate || toDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFromDate(undefined);
              setToDate(undefined);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Loading entries...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No time entries found. Start tracking or add a manual entry.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="text-sm">{formatDate(entry.startTime)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(entry.startTime)}
                    {entry.endTime ? ` - ${formatTime(entry.endTime)}` : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.project.color && (
                      <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.project.color }}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {entry.project.name}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.project.client.companyName}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {entry.description || (
                      <span className="text-muted-foreground italic">
                        No description
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {entry.duration != null
                      ? formatDurationShort(entry.duration)
                      : "Running..."}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={entry.billable ? "default" : "secondary"}>
                    {entry.billable ? "Billable" : "Non-billable"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(entry)}
                      aria-label="Edit entry"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={editingEntry}
        onSave={handleSave}
      />
    </div>
  );
}
