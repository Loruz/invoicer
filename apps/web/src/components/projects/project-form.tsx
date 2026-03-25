"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { currencies } from "@invoicer/shared";
import { Loader2, Check, ChevronDownIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldHint } from "@/components/ui/field-hint";

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

export function ProjectForm({ projectId, defaultClientId, initialData }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [clientId, setClientId] = useState(initialData?.clientId ?? defaultClientId ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [hourlyRateDisplay, setHourlyRateDisplay] = useState(
    initialData?.hourlyRate != null ? (initialData.hourlyRate / 100).toFixed(2) : ""
  );
  const [currency, setCurrency] = useState(initialData?.currency ?? "USD");
  const [color, setColor] = useState(initialData?.color ?? "#3b82f6");
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  useEffect(() => {
    fetch("/api/clients").then((r) => r.ok ? r.json() : []).then(setClients).finally(() => setLoadingClients(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const hourlyRateCents = hourlyRateDisplay ? Math.round(parseFloat(hourlyRateDisplay) * 100) : undefined;
    const body = { name, clientId, description: description || undefined, hourlyRate: hourlyRateCents, currency, color: color || undefined, isActive };
    try {
      const res = await fetch(isEditing ? `/api/projects/${projectId}` : "/api/projects", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Something went wrong"); }
      const project = await res.json();
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Project" : "Create New Project"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing ? "Update project details." : "Set up a new project and assign it to a client."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name || !clientId} className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] disabled:opacity-50">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEditing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* Project Details */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">Project Details</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Project Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" required className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project scope and goals..." rows={4} className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Client *</label>
                  {!loadingClients && clients.length === 0 ? (
                    <FieldHint
                      message="You need to add a client before creating a project."
                      ctaLabel="Add Client"
                      ctaHref="/clients/new"
                    >
                      <div className="flex w-full items-center justify-between rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-60">
                        <span>Select client</span>
                        <ChevronDownIcon className="size-4 text-muted-foreground" />
                      </div>
                    </FieldHint>
                  ) : (
                    <Select value={clientId || null} onValueChange={(val) => { if (val !== null) setClientId(val); }}>
                      <SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <Select value={isActive ? "active" : "inactive"} onValueChange={(val) => { if (val !== null) setIsActive(val === "active"); }}>
                    <SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">Billing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Hourly Rate</label>
                <input value={hourlyRateDisplay} onChange={(e) => setHourlyRateDisplay(e.target.value)} type="number" step="0.01" min="0" placeholder="0.00" className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Currency</label>
                <Select value={currency || null} onValueChange={(val) => { if (val !== null) setCurrency(val); }}>
                  <SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.symbol} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Color */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">Project Color</h2>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border border-[#E8ECF1] p-0.5"
              />
              <input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">Used to identify this project in calendars and charts.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
