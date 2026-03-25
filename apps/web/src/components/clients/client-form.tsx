"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import {
  createClientSchema,
  type CreateClientInput,
} from "@invoicer/shared";

interface ClientFormProps {
  clientId?: string;
  initialData?: Partial<CreateClientInput>;
}

export function ClientForm({ clientId, initialData }: ClientFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!clientId;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => {
      const str = value.toString().trim();
      if (str) raw[key] = str;
    });

    const parsed = createClientSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      toast.error(firstError?.message ?? "Invalid form data");
      setLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/clients/${clientId}` : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }

      const client = await res.json();
      toast.success(isEditing ? "Client updated" : "Client created");
      router.push(`/clients/${client.id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditing ? "Edit Client" : "Add New Client"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEditing
              ? "Update the client details."
              : "Fill in the details to add a new client to your account."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isEditing ? "Save Changes" : "Save Client"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Contact Information & Billing Address */}
        <div className="col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Company Name *
                </label>
                <input
                  name="companyName"
                  required
                  defaultValue={initialData?.companyName ?? ""}
                  placeholder="Enter company name"
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contact Name
                </label>
                <input
                  name="contactName"
                  defaultValue={initialData?.contactName ?? ""}
                  placeholder="Full name of primary contact"
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={initialData?.email ?? ""}
                    placeholder="email@example.com"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    defaultValue={initialData?.phone ?? ""}
                    placeholder="+1 (555) 000-0000"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Billing Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Street Address
                </label>
                <input
                  name="address"
                  defaultValue={initialData?.address ?? ""}
                  placeholder="123 Main Street"
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    name="city"
                    defaultValue={initialData?.city ?? ""}
                    placeholder="City"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    ZIP / Postal Code
                  </label>
                  <input
                    name="postalCode"
                    defaultValue={initialData?.postalCode ?? ""}
                    placeholder="00000"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Country
                </label>
                <input
                  name="country"
                  defaultValue={initialData?.country ?? ""}
                  placeholder="United States"
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Tax Info & Notes */}
        <div className="space-y-6">
          {/* Tax Information */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Tax Information
            </h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Tax ID / VAT Number
              </label>
              <input
                name="taxId"
                defaultValue={initialData?.taxId ?? ""}
                placeholder="e.g. US-EIN-12-3456789"
                className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-6">
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Notes
            </h2>
            <textarea
              name="notes"
              defaultValue={initialData?.notes ?? ""}
              placeholder="Add internal notes about this client..."
              rows={5}
              className="w-full rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
