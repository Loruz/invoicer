"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, User, Building2, FileText, AlertTriangle, Palette, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  currencies,
  updateUserSettingsSchema,
  type User as UserType,
} from "@invoicer/shared";

interface SettingsFormProps {
  user: UserType;
}

const PAYMENT_TERMS = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net_7", label: "Net 7" },
  { value: "net_15", label: "Net 15" },
  { value: "net_30", label: "Net 30" },
  { value: "net_45", label: "Net 45" },
  { value: "net_60", label: "Net 60" },
  { value: "net_90", label: "Net 90" },
];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "company", label: "Company", icon: Building2 },
  { id: "invoice-defaults", label: "Invoice Defaults", icon: FileText },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
] as const;

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("profile");
  const [defaultCurrency, setDefaultCurrency] = useState(user.defaultCurrency ?? "USD");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const raw: Record<string, string> = {};
    formData.forEach((value, key) => {
      const str = value.toString().trim();
      if (str) raw[key] = str;
    });
    raw.defaultCurrency = defaultCurrency;

    const parsed = updateUserSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid form data");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }
      toast.success("Settings updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`settings-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={onSubmit}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account and invoice preferences.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] disabled:opacity-50 transition-colors"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="flex gap-8">
        {/* Section Navigation */}
        <nav className="w-48 shrink-0">
          <div className="sticky top-6 space-y-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === id
                    ? "bg-blue-50 text-blue-700"
                    : id === "danger"
                      ? "text-red-500 hover:bg-red-50"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    activeSection === id
                      ? "text-blue-600"
                      : id === "danger"
                        ? "text-red-400"
                        : "text-slate-400"
                  }`}
                />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl space-y-6">
          {/* Profile */}
          <div
            id="settings-profile"
            className="rounded-xl border border-[#E8ECF1] bg-white p-6"
          >
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Profile
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {user.name || "User"}
                </p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                name="name"
                defaultValue={user.name ?? ""}
                placeholder="Your full name"
                className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Company Information */}
          <div
            id="settings-company"
            className="rounded-xl border border-[#E8ECF1] bg-white p-6"
          >
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Company Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Company Name
                  </label>
                  <input
                    name="businessName"
                    defaultValue={user.businessName ?? ""}
                    placeholder="Your Company LLC"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Business Email
                  </label>
                  <input
                    name="businessEmail"
                    defaultValue={user.businessEmail ?? ""}
                    type="email"
                    placeholder="billing@company.com"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    name="businessPhone"
                    defaultValue={user.businessPhone ?? ""}
                    placeholder="+1 (555) 234-5678"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Business Entity
                  </label>
                  <input
                    name="businessEntity"
                    defaultValue={user.businessEntity ?? ""}
                    placeholder="e.g. Individuali veikla, MB, LLC"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tax ID / VAT
                  </label>
                  <input
                    name="taxId"
                    defaultValue={user.taxId ?? ""}
                    placeholder="XX-XXXXXXX"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Company Code
                  </label>
                  <input
                    name="companyCode"
                    defaultValue={user.companyCode ?? ""}
                    placeholder="e.g. 763401"
                    className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Address
                </label>
                <textarea
                  name="businessAddress"
                  defaultValue={user.businessAddress ?? ""}
                  placeholder={"123 Main Street\nCity, State 12345"}
                  rows={3}
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none transition-colors"
                />
              </div>

              {/* Bank Details */}
              <div className="pt-2">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Bank Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Bank Name
                    </label>
                    <input
                      name="bankName"
                      defaultValue={user.bankName ?? ""}
                      placeholder="e.g. SEB"
                      className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Bank Code
                    </label>
                    <input
                      name="bankCode"
                      defaultValue={user.bankCode ?? ""}
                      placeholder="e.g. 70440"
                      className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      SWIFT Code
                    </label>
                    <input
                      name="bankSwift"
                      defaultValue={user.bankSwift ?? ""}
                      placeholder="e.g. CBVILT2X"
                      className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Account Number (IBAN)
                    </label>
                    <input
                      name="bankAccount"
                      defaultValue={user.bankAccount ?? ""}
                      placeholder="e.g. LT877044060007713233"
                      className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Template Link */}
          <Link
            href="/settings/invoice-template"
            className="flex items-center justify-between rounded-xl border border-[#E8ECF1] bg-white p-5 hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Palette className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Invoice Template</p>
                <p className="text-xs text-slate-500">Customize colors, fonts, layout, and sections</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>

          {/* Invoice Defaults */}
          <div
            id="settings-invoice-defaults"
            className="rounded-xl border border-[#E8ECF1] bg-white p-6"
          >
            <h2 className="mb-5 text-base font-semibold text-slate-900">
              Invoice Defaults
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Payment Terms
                  </label>
                  <Select defaultValue="net_30">
                    <SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
                      <SelectValue>
                        {(value) => PAYMENT_TERMS.find((t) => t.value === value)?.label ?? value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Currency
                  </label>
                  <Select value={defaultCurrency} onValueChange={(val) => { if (val !== null) setDefaultCurrency(val); }}>
                    <SelectTrigger className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm">
                      <SelectValue>
                        {(value) => { const c = currencies.find((c) => c.code === value); return c ? `${c.code} (${c.symbol})` : value; }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Default Tax Rate
                  </label>
                  <div className="relative">
                    <input
                      name="defaultTaxRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      defaultValue="0"
                      placeholder="0"
                      className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 pr-8 text-sm text-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Default Notes
                </label>
                <textarea
                  name="defaultInvoiceNotes"
                  placeholder="Thank you for your business. Payment is due within the specified terms."
                  rows={3}
                  className="w-full rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 resize-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            id="settings-danger"
            className="rounded-xl border border-red-200 bg-red-50/30 p-6"
          >
            <h2 className="mb-2 text-base font-semibold text-red-600">
              Danger Zone
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              Once you delete your account, there is no going back. All your
              data, invoices, and client records will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                onClick={() =>
                  toast.error(
                    "Account deletion is not yet available. Contact support."
                  )
                }
              >
                Delete Account
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#E8ECF1] bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() =>
                  toast.info("Data export is coming soon.")
                }
              >
                Export All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
