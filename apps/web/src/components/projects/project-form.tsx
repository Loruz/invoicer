"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { currencies } from "@invoicer/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface Client {
  id: string;
  companyName: string;
}

interface ProjectFormProps {
  projectId?: string;
  defaultClientId?: string;
  initialData?: {
    name: string;
    clientId: string;
    description: string;
    hourlyRate?: number;
    currency: string;
    color: string;
    isActive: boolean;
  };
}

export function ProjectForm({
  projectId,
  defaultClientId,
  initialData,
}: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [clientId, setClientId] = useState(
    initialData?.clientId ?? defaultClientId ?? "",
  );
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [hourlyRateDisplay, setHourlyRateDisplay] = useState(
    initialData?.hourlyRate != null
      ? (initialData.hourlyRate / 100).toFixed(2)
      : "",
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD");
  const [color, setColor] = useState(initialData?.color ?? "");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch {
      // silently fail, user will see empty dropdown
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const hourlyRateCents = hourlyRateDisplay
      ? Math.round(parseFloat(hourlyRateDisplay) * 100)
      : undefined;

    const body = {
      name,
      clientId,
      description: description || undefined,
      hourlyRate: hourlyRateCents,
      currency,
      color: color || undefined,
      isActive,
    };

    try {
      const url = isEditing ? `/api/projects/${projectId}` : "/api/projects";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Project" : "Create Project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Client *</Label>
            {loadingClients ? (
              <p className="text-sm text-muted-foreground">
                Loading clients...
              </p>
            ) : clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients found. Please create a client first.
              </p>
            ) : (
              <Select value={clientId} onValueChange={(val) => val !== null && setClientId(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRateDisplay}
                onChange={(e) => setHourlyRateDisplay(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(val) => val !== null && setCurrency(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
              {color && /^#[0-9a-fA-F]{6}$/.test(color) && (
                <span
                  className="inline-block size-8 rounded-md border"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Hex color code, e.g. #3b82f6
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting || !name || !clientId}>
              {submitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Project"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
