"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  Palette,
  Type,
  Layout,
  Eye,
  FileText,
  Upload,
  X,
} from "lucide-react";
import {
  type User as UserType,
  type InvoiceTemplate,
  DEFAULT_INVOICE_TEMPLATE,
} from "@invoicer/shared";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { InvoicePreview } from "@/components/invoices/invoice-preview";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface TemplateEditorProps {
  user: UserType;
}

// Sample invoice data for live preview
const SAMPLE_INVOICE = {
  invoiceNumber: "INV-2026-0042",
  status: "pending",
  issueDate: new Date("2026-03-15"),
  dueDate: new Date("2026-04-14"),
  currency: "USD",
  subtotal: 1008000,
  taxTotal: 100800,
  discountTotal: 0,
  total: 1108800,
  notes: "Thank you for your business. Payment is due within 30 days of invoice date.",
  paymentTerms: "Bank Transfer - Net 30",
  client: {
    id: "sample",
    userId: "sample",
    companyName: "Acme Corporation",
    companyCode: null,
    contactName: "John Smith",
    email: "john@acme.com",
    phone: "+1 (555) 123-4567",
    address: "456 Corp Blvd",
    city: "New York",
    country: "NY",
    postalCode: "10001",
    taxId: "US-TAX-123456",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  lineItems: [
    { id: "1", description: "UI/UX Design - Homepage", quantity: 24, unitPrice: 12000, amount: 288000, taxRate: 10, taxAmount: 28800 },
    { id: "2", description: "Frontend Development", quantity: 40, unitPrice: 15000, amount: 600000, taxRate: 10, taxAmount: 60000 },
    { id: "3", description: "QA Testing & Bug Fixes", quantity: 12, unitPrice: 10000, amount: 120000, taxRate: 10, taxAmount: 12000 },
  ],
  discounts: [],
};

const SAMPLE_USER = {
  name: "Sarah Chen",
  businessName: "Chen Design Studio",
  businessAddress: "123 Business Ave, Suite 100\nSan Francisco, CA 94102",
  businessEmail: "billing@chenstudio.com",
  businessPhone: "+1 (555) 234-5678",
  businessEntity: "LLC",
  taxId: "US-EIN-12-3456789",
  companyCode: "763401",
  bankName: "First National Bank",
  bankCode: "70440",
  bankSwift: "FNBKUS33",
  bankAccount: "US12345678901234",
  email: "sarah@chenstudio.com",
};

const COLOR_PRESETS = [
  { label: "Blue", primary: "#2563eb", accent: "#0F766E" },
  { label: "Indigo", primary: "#4f46e5", accent: "#7c3aed" },
  { label: "Emerald", primary: "#059669", accent: "#0d9488" },
  { label: "Slate", primary: "#475569", accent: "#334155" },
  { label: "Rose", primary: "#e11d48", accent: "#be123c" },
  { label: "Amber", primary: "#d97706", accent: "#b45309" },
];

const LAYOUT_OPTIONS: { value: InvoiceTemplate["layout"]; label: string; desc: string }[] = [
  { value: "classic", label: "Classic", desc: "Traditional business layout" },
  { value: "modern", label: "Modern", desc: "Clean with colored accents" },
  { value: "minimal", label: "Minimal", desc: "Maximum whitespace" },
  { value: "formal", label: "Formal", desc: "Traditional document style" },
];

const FONT_OPTIONS: { value: InvoiceTemplate["fontFamily"]; label: string; sample: string }[] = [
  { value: "default", label: "Sans Serif", sample: "Aa" },
  { value: "serif", label: "Serif", sample: "Aa" },
  { value: "mono", label: "Monospace", sample: "Aa" },
];

const FONT_CSS: Record<string, string> = {
  default: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, monospace",
};

function LogoUpload({
  logoUrl,
  onUpload,
  onRemove,
}: {
  logoUrl: string | null;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("logoUploader");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await startUpload([file]);
      if (res?.[0]?.ufsUrl) {
        onUpload(res[0].ufsUrl);
        toast.success("Logo uploaded");
      }
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-medium text-slate-500">
        Logo
      </label>
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-12 w-12 rounded-lg border border-[#E8ECF1] object-contain bg-white p-1"
          />
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#E8ECF1] px-4 py-3 text-xs text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload logo (max 2MB)
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}

export function TemplateEditor({ user }: TemplateEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const initial: InvoiceTemplate = {
    ...DEFAULT_INVOICE_TEMPLATE,
    ...(user.invoiceTemplate as InvoiceTemplate | null),
  };

  const [template, setTemplate] = useState<InvoiceTemplate>(initial);

  const update = (partial: Partial<InvoiceTemplate>) => {
    setTemplate((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceTemplate: template }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save");
      }
      toast.success("Invoice template saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settings")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8ECF1] hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoice Template</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Customize how your invoices look.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Template
        </button>
      </div>

      {/* Split panel */}
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left: Controls */}
        <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
          {/* Branding */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Branding</h2>
            </div>

            {/* Logo upload */}
            <LogoUpload
              logoUrl={template.logoUrl}
              onUpload={(url) => update({ logoUrl: url })}
              onRemove={() => update({ logoUrl: null })}
            />

            {/* Color presets */}
            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                Color Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      update({
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                      })
                    }
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                      template.primaryColor === preset.primary
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-[#E8ECF1] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: preset.primary }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <label
                    className="relative h-8 w-8 shrink-0 cursor-pointer rounded-md border border-[#E8ECF1] overflow-hidden"
                    style={{ backgroundColor: template.primaryColor }}
                  >
                    <input
                      type="color"
                      value={template.primaryColor}
                      onChange={(e) => update({ primaryColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={template.primaryColor}
                    onChange={(e) => update({ primaryColor: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-[#E8ECF1] px-2 py-1.5 text-xs font-mono text-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <label
                    className="relative h-8 w-8 shrink-0 cursor-pointer rounded-md border border-[#E8ECF1] overflow-hidden"
                    style={{ backgroundColor: template.accentColor }}
                  >
                    <input
                      type="color"
                      value={template.accentColor}
                      onChange={(e) => update({ accentColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={template.accentColor}
                    onChange={(e) => update({ accentColor: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-[#E8ECF1] px-2 py-1.5 text-xs font-mono text-slate-600 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Typography</h2>
            </div>
            <div className="space-y-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => update({ fontFamily: font.value })}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    template.fontFamily === font.value
                      ? "border-blue-300 bg-blue-50"
                      : "border-[#E8ECF1] hover:bg-slate-50"
                  }`}
                >
                  <span
                    className="text-lg font-semibold text-slate-700 w-8"
                    style={{ fontFamily: FONT_CSS[font.value] }}
                  >
                    {font.sample}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      template.fontFamily === font.value
                        ? "text-blue-700"
                        : "text-slate-600"
                    }`}
                  >
                    {font.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Layout</h2>
            </div>
            <div className="space-y-2">
              {LAYOUT_OPTIONS.map((layout) => (
                <button
                  key={layout.value}
                  onClick={() => update({ layout: layout.value })}
                  className={`flex w-full flex-col items-start rounded-lg border px-3 py-2.5 transition-colors ${
                    template.layout === layout.value
                      ? "border-blue-300 bg-blue-50"
                      : "border-[#E8ECF1] hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      template.layout === layout.value
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {layout.label}
                  </span>
                  <span className="text-xs text-slate-400">{layout.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Sections</h2>
            </div>
            <div className="space-y-3">
              {[
                { key: "showLogo" as const, label: "Company Logo" },
                { key: "showTaxId" as const, label: "Tax ID / VAT" },
                { key: "showPaymentTerms" as const, label: "Payment Terms" },
                { key: "showNotes" as const, label: "Notes" },
                { key: "showBankDetails" as const, label: "Bank Details" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-sm text-slate-600">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={template[key]}
                    onClick={() => update({ [key]: !template[key] })}
                    className={`relative h-6 w-10 rounded-full transition-colors ${
                      template[key] ? "bg-blue-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        template[key] ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Footer</h2>
            </div>
            <textarea
              value={template.footerText ?? ""}
              onChange={(e) =>
                update({ footerText: e.target.value || null })
              }
              placeholder="Custom footer text (e.g. Thank you for your business!)"
              rows={2}
              className="w-full rounded-lg border border-[#E8ECF1] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-[#E8ECF1] bg-slate-50/50 p-8">
          <div className="transform scale-[0.95] origin-top">
            <InvoicePreview
              invoice={SAMPLE_INVOICE}
              user={SAMPLE_USER}
              template={template}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
