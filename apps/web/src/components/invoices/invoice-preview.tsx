"use client";

import { formatCurrency } from "@invoicer/shared";
import type { Client, InvoiceTemplate } from "@invoicer/shared";
import { DEFAULT_INVOICE_TEMPLATE } from "@invoicer/shared";
import { CheckSquare } from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: number;
  amount: number;
  taxRate: string | number;
  taxAmount: number;
}

interface InvoiceDiscount {
  id: string;
  description: string;
  type: string;
  value: string | number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  client: Client;
  lineItems: LineItem[];
  discounts: InvoiceDiscount[];
}

interface User {
  name: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessEntity: string | null;
  taxId: string | null;
  companyCode: string | null;
  bankName: string | null;
  bankCode: string | null;
  bankSwift: string | null;
  bankAccount: string | null;
  email: string;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  user: User;
  template?: InvoiceTemplate | null;
}

const FONT_FAMILIES: Record<string, string> = {
  default: "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono, ui-monospace, monospace)",
};

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Shared sub-components used across layouts

function BusinessInfo({ user, t }: { user: User; t: InvoiceTemplate }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {t.showLogo && (
          t.logoUrl ? (
            <img src={t.logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
          ) : (
            <div
              className="flex h-6 w-6 items-center justify-center rounded"
              style={{ backgroundColor: t.accentColor }}
            >
              <CheckSquare className="h-3 w-3 text-white" />
            </div>
          )
        )}
        <span className="text-base font-bold text-slate-900">
          {user.businessName || user.name || "Invoicer"}
        </span>
      </div>
      {user.businessEntity && (
        <p className="text-sm text-slate-500">{user.businessEntity}</p>
      )}
      {user.companyCode && (
        <p className="text-sm text-slate-500">Įmonės kodas: {user.companyCode}</p>
      )}
      {t.showTaxId && user.taxId && (
        <p className="text-sm text-slate-500">PVM kodas: {user.taxId}</p>
      )}
      {user.businessAddress && (
        <p className="text-sm text-slate-500 whitespace-pre-line">{user.businessAddress}</p>
      )}
      {(user.businessEmail || user.email) && (
        <p className="text-sm text-slate-500">{user.businessEmail || user.email}</p>
      )}
      {t.showBankDetails && (user.bankName || user.bankAccount) && (
        <div className="mt-2 text-sm text-slate-500 space-y-0.5">
          {user.bankName && <p>Bankas: {user.bankName}</p>}
          {user.bankCode && <p>Banko kodas: {user.bankCode}</p>}
          {user.bankSwift && <p>SWIFT: {user.bankSwift}</p>}
          {user.bankAccount && <p>Sąskaita: {user.bankAccount}</p>}
        </div>
      )}
    </div>
  );
}

function ClientInfo({ invoice, t }: { invoice: InvoiceData; t: InvoiceTemplate }) {
  return (
    <div>
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-1"
        style={{ color: t.primaryColor }}
      >
        Pirkėjas
      </p>
      <h3 className="text-base font-semibold text-slate-900">{invoice.client.companyName}</h3>
      {invoice.client.contactName && (
        <p className="text-sm text-slate-500">{invoice.client.contactName}</p>
      )}
      {invoice.client.email && (
        <p className="text-sm text-slate-500">{invoice.client.email}</p>
      )}
      {invoice.client.address && (
        <p className="text-sm text-slate-500">
          {[invoice.client.address, invoice.client.city, invoice.client.country].filter(Boolean).join(", ")}
        </p>
      )}
    </div>
  );
}

function InvoiceDates({ invoice }: { invoice: InvoiceData }) {
  return (
    <div className="text-right text-sm space-y-1">
      <div>
        <span className="text-slate-400">Išrašymo data</span>
        <span className="ml-4 font-medium text-slate-900">{formatDate(invoice.issueDate)}</span>
      </div>
      <div>
        <span className="text-slate-400">Apmokėjimo data</span>
        <span className="ml-4 font-medium text-slate-900">{formatDate(invoice.dueDate)}</span>
      </div>
    </div>
  );
}

function LineItemsTable({ invoice, t }: { invoice: InvoiceData; t: InvoiceTemplate }) {
  return (
    <table className="w-full mb-6">
      <thead>
        <tr style={{ borderBottom: `2px solid ${t.primaryColor}20` }}>
          <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Aprašymas</th>
          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Kiekis</th>
          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Kaina</th>
          <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Suma</th>
        </tr>
      </thead>
      <tbody>
        {invoice.lineItems.map((item) => (
          <tr key={item.id} className="border-b border-slate-100">
            <td className="py-3 text-sm text-slate-900">{item.description}</td>
            <td className="py-3 text-right text-sm text-slate-500">{Number(item.quantity)} val.</td>
            <td className="py-3 text-right text-sm text-slate-500">{formatCurrency(item.unitPrice, invoice.currency)}</td>
            <td className="py-3 text-right text-sm font-medium text-slate-900">{formatCurrency(item.amount, invoice.currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ invoice, t }: { invoice: InvoiceData; t: InvoiceTemplate }) {
  return (
    <div className="flex justify-end mb-8">
      <div className="w-64 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Tarpinė suma</span>
          <span className="text-slate-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        {invoice.taxTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">PVM</span>
            <span className="text-slate-900">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
          </div>
        )}
        {invoice.discountTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Nuolaida</span>
            <span className="text-red-500">-{formatCurrency(invoice.discountTotal, invoice.currency)}</span>
          </div>
        )}
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="text-sm font-bold text-slate-900">Mokėti</span>
          <span className="text-lg font-bold" style={{ color: t.accentColor }}>
            {formatCurrency(invoice.total, invoice.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PaymentDetails({ invoice, t }: { invoice: InvoiceData; t: InvoiceTemplate }) {
  if (!(t.showPaymentTerms && invoice.paymentTerms) && !(t.showNotes && invoice.notes)) return null;
  return (
    <div className="border-t border-slate-200 pt-6">
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: t.primaryColor }}
      >
        Mokėjimo informacija
      </p>
      {t.showPaymentTerms && invoice.paymentTerms && (
        <p className="text-sm text-slate-500 whitespace-pre-line">{invoice.paymentTerms}</p>
      )}
      {t.showNotes && invoice.notes && (
        <p className="text-sm text-slate-500 whitespace-pre-line mt-1">{invoice.notes}</p>
      )}
    </div>
  );
}

function FooterSection({ t }: { t: InvoiceTemplate }) {
  if (!t.footerText) return null;
  return (
    <div className="mt-8 pt-4 border-t border-slate-100 text-center">
      <p className="text-xs text-slate-400">{t.footerText}</p>
    </div>
  );
}

// ─── Classic Layout ─────────────────────────────────────────────────────────
// Traditional business invoice — clean two-column header, standard table.

function ClassicLayout({ invoice, user, t }: { invoice: InvoiceData; user: User; t: InvoiceTemplate }) {
  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <BusinessInfo user={user} t={t} />
        <div className="text-right">
          <h1 className="text-3xl font-bold tracking-tight text-slate-300">SĄSKAITA FAKTŪRA</h1>
          <p className="text-sm font-medium" style={{ color: t.primaryColor }}>
            #{invoice.invoiceNumber}
          </p>
        </div>
      </div>

      <div className="flex justify-between mb-10">
        <ClientInfo invoice={invoice} t={t} />
        <InvoiceDates invoice={invoice} />
      </div>

      <LineItemsTable invoice={invoice} t={t} />
      <Totals invoice={invoice} t={t} />
      <PaymentDetails invoice={invoice} t={t} />
      <FooterSection t={t} />
    </>
  );
}

// ─── Modern Layout ──────────────────────────────────────────────────────────
// Colored top banner with invoice number, bold accent stripe on the table.

function ModernLayout({ invoice, user, t }: { invoice: InvoiceData; user: User; t: InvoiceTemplate }) {
  return (
    <>
      {/* Colored banner */}
      <div
        className="rounded-lg px-6 py-5 mb-8 flex items-start justify-between"
        style={{ backgroundColor: t.primaryColor }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white/90">SĄSKAITA FAKTŪRA</h1>
          <p className="text-sm text-white/70 mt-0.5">#{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right text-sm text-white/80 space-y-0.5">
          <div>Išrašyta: {formatDate(invoice.issueDate)}</div>
          <div>Apmokėti iki: {formatDate(invoice.dueDate)}</div>
        </div>
      </div>

      {/* From / To columns */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pardavėjas</p>
          <p className="text-sm font-semibold text-slate-900">{user.businessName || user.name || "Invoicer"}</p>
          {user.businessEntity && (
            <p className="text-sm text-slate-500">{user.businessEntity}</p>
          )}
          {user.companyCode && (
            <p className="text-sm text-slate-500">Įmonės kodas: {user.companyCode}</p>
          )}
          {t.showTaxId && user.taxId && (
            <p className="text-sm text-slate-500">PVM kodas: {user.taxId}</p>
          )}
          {user.businessAddress && (
            <p className="text-sm text-slate-500 whitespace-pre-line">{user.businessAddress}</p>
          )}
          {(user.businessEmail || user.email) && (
            <p className="text-sm text-slate-500">{user.businessEmail || user.email}</p>
          )}
          {t.showBankDetails && (user.bankName || user.bankAccount) && (
            <div className="mt-2 text-sm text-slate-500 space-y-0.5">
              {user.bankName && <p>Bankas: {user.bankName}</p>}
              {user.bankCode && <p>Banko kodas: {user.bankCode}</p>}
              {user.bankSwift && <p>SWIFT: {user.bankSwift}</p>}
              {user.bankAccount && <p>Sąskaita: {user.bankAccount}</p>}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pirkėjas</p>
          <p className="text-sm font-semibold text-slate-900">{invoice.client.companyName}</p>
          {invoice.client.contactName && (
            <p className="text-sm text-slate-500">{invoice.client.contactName}</p>
          )}
          {invoice.client.email && (
            <p className="text-sm text-slate-500">{invoice.client.email}</p>
          )}
          {invoice.client.address && (
            <p className="text-sm text-slate-500">
              {[invoice.client.address, invoice.client.city, invoice.client.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Table with accent-colored header row */}
      <table className="w-full mb-6">
        <thead>
          <tr>
            <th
              className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-white rounded-l-md"
              style={{ backgroundColor: t.primaryColor }}
            >
              Aprašymas
            </th>
            <th
              className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: t.primaryColor }}
            >
              Kiekis
            </th>
            <th
              className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: t.primaryColor }}
            >
              Kaina
            </th>
            <th
              className="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white rounded-r-md"
              style={{ backgroundColor: t.primaryColor }}
            >
              Suma
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? "bg-slate-50/50" : ""}>
              <td className="py-3 px-3 text-sm text-slate-900">{item.description}</td>
              <td className="py-3 px-3 text-right text-sm text-slate-500">{Number(item.quantity)} val.</td>
              <td className="py-3 px-3 text-right text-sm text-slate-500">{formatCurrency(item.unitPrice, invoice.currency)}</td>
              <td className="py-3 px-3 text-right text-sm font-medium text-slate-900">{formatCurrency(item.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Totals invoice={invoice} t={t} />
      <PaymentDetails invoice={invoice} t={t} />
      <FooterSection t={t} />
    </>
  );
}

// ─── Minimal Layout ─────────────────────────────────────────────────────────
// Maximum whitespace, understated typography, no heavy borders or colors.

function MinimalLayout({ invoice, user, t }: { invoice: InvoiceData; user: User; t: InvoiceTemplate }) {
  return (
    <>
      {/* Invoice number top-right, small and understated */}
      <div className="flex justify-between items-start mb-12">
        <div>
          {t.showLogo && !t.logoUrl && (
            <div
              className="h-1 w-10 rounded-full mb-6"
              style={{ backgroundColor: t.accentColor }}
            />
          )}
          {t.showLogo && t.logoUrl && (
            <img src={t.logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain mb-6" />
          )}
          <p className="text-sm text-slate-900 font-medium">{user.businessName || user.name || "Invoicer"}</p>
          {user.businessEntity && (
            <p className="text-xs text-slate-400 mt-0.5">{user.businessEntity}</p>
          )}
          {user.companyCode && (
            <p className="text-xs text-slate-400">{user.companyCode}</p>
          )}
          {t.showTaxId && user.taxId && (
            <p className="text-xs text-slate-400">{user.taxId}</p>
          )}
          {user.businessAddress && (
            <p className="text-xs text-slate-400 whitespace-pre-line mt-1">{user.businessAddress}</p>
          )}
          {(user.businessEmail || user.email) && (
            <p className="text-xs text-slate-400">{user.businessEmail || user.email}</p>
          )}
          {t.showBankDetails && (user.bankName || user.bankAccount) && (
            <div className="mt-1.5 text-xs text-slate-400 space-y-0.5">
              {user.bankName && <p>Bankas: {user.bankName}</p>}
              {user.bankCode && <p>Banko kodas: {user.bankCode}</p>}
              {user.bankSwift && <p>SWIFT: {user.bankSwift}</p>}
              {user.bankAccount && <p>Sąskaita: {user.bankAccount}</p>}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-widest">Sąskaita faktūra</p>
          <p className="text-sm text-slate-600 mt-0.5">{invoice.invoiceNumber}</p>
          <p className="text-xs text-slate-400 mt-3">{formatDate(invoice.issueDate)}</p>
          <p className="text-xs text-slate-400">Apmokėti iki {formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      {/* Client — single line label */}
      <div className="mb-10">
        <p className="text-xs text-slate-400 mb-1">Pirkėjas</p>
        <p className="text-sm text-slate-900">{invoice.client.companyName}</p>
        {invoice.client.email && (
          <p className="text-xs text-slate-400">{invoice.client.email}</p>
        )}
        {invoice.client.address && (
          <p className="text-xs text-slate-400">
            {[invoice.client.address, invoice.client.city, invoice.client.country].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {/* Simple table — no background, thin bottom borders only */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="pb-2 text-left text-xs font-normal text-slate-400">Aprašymas</th>
            <th className="pb-2 text-right text-xs font-normal text-slate-400">Kiekis</th>
            <th className="pb-2 text-right text-xs font-normal text-slate-400">Kaina</th>
            <th className="pb-2 text-right text-xs font-normal text-slate-400">Suma</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-3 text-sm text-slate-700">{item.description}</td>
              <td className="py-3 text-right text-sm text-slate-400">{Number(item.quantity)}</td>
              <td className="py-3 text-right text-sm text-slate-400">{formatCurrency(item.unitPrice, invoice.currency)}</td>
              <td className="py-3 text-right text-sm text-slate-700">{formatCurrency(item.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals — right-aligned, understated */}
      <div className="flex justify-end mb-10">
        <div className="w-56 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Tarpinė suma</span>
            <span className="text-slate-600">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.taxTotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">PVM</span>
              <span className="text-slate-600">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
            </div>
          )}
          {invoice.discountTotal > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Nuolaida</span>
              <span className="text-red-400">-{formatCurrency(invoice.discountTotal, invoice.currency)}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="text-sm text-slate-700">Viso</span>
            <span className="text-sm font-semibold text-slate-900">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment / notes — minimal */}
      {((t.showPaymentTerms && invoice.paymentTerms) || (t.showNotes && invoice.notes)) && (
        <div className="border-t border-slate-100 pt-6">
          {t.showPaymentTerms && invoice.paymentTerms && (
            <p className="text-xs text-slate-400 whitespace-pre-line">{invoice.paymentTerms}</p>
          )}
          {t.showNotes && invoice.notes && (
            <p className="text-xs text-slate-400 whitespace-pre-line mt-1">{invoice.notes}</p>
          )}
        </div>
      )}

      {t.footerText && (
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-300">{t.footerText}</p>
        </div>
      )}
    </>
  );
}

// ─── Formal Layout ──────────────────────────────────────────────────────────
// Traditional document-style invoice — centered header, two-column seller/buyer,
// plain table with bottom borders, total right-aligned, issuer line at bottom.

function FormalLayout({ invoice, user, t }: { invoice: InvoiceData; user: User; t: InvoiceTemplate }) {
  return (
    <>
      {/* Centered header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-wide mb-4">
          Sąskaita faktūra
        </h1>
        <div className="text-sm text-slate-600 space-y-0.5">
          <p>Nr. {invoice.invoiceNumber}</p>
          <p>Sąskaitos data {formatDate(invoice.issueDate)}</p>
          {invoice.dueDate && <p>Apmokėti iki {formatDate(invoice.dueDate)}</p>}
        </div>
      </div>

      {/* Seller / Buyer two columns */}
      <div className="grid grid-cols-2 gap-10 mb-10">
        <div>
          <p className="text-base font-bold text-slate-900 mb-2">Pardavėjas</p>
          <div className="text-sm text-slate-700 space-y-0.5">
            <p>{user.businessName || user.name || "Invoicer"}</p>
            {user.businessEntity && <p>{user.businessEntity}</p>}
            {user.companyCode && <p>Įmonės kodas: {user.companyCode}</p>}
            {t.showTaxId && user.taxId && <p>PVM kodas: {user.taxId}</p>}
            {user.businessAddress && (
              <p className="whitespace-pre-line">{user.businessAddress}</p>
            )}
            {user.businessPhone && <p>{user.businessPhone}</p>}
            {(user.businessEmail || user.email) && (
              <p>{user.businessEmail || user.email}</p>
            )}
            {t.showBankDetails && (user.bankName || user.bankAccount) && (
              <div className="mt-2 space-y-0.5">
                {user.bankName && <p>Bankas: {user.bankName}</p>}
                {user.bankCode && <p>Banko kodas: {user.bankCode}</p>}
                {user.bankSwift && <p>SWIFT: {user.bankSwift}</p>}
                {user.bankAccount && <p>Sąskaita: {user.bankAccount}</p>}
              </div>
            )}
          </div>
          {/* Payment terms as bank details */}
          {t.showPaymentTerms && invoice.paymentTerms && (
            <p className="text-sm text-slate-700 whitespace-pre-line mt-3">
              {invoice.paymentTerms}
            </p>
          )}
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 mb-2">Pirkėjas</p>
          <div className="text-sm text-slate-700 space-y-0.5">
            <p>{invoice.client.companyName}</p>
            {invoice.client.taxId && <p>{invoice.client.taxId}</p>}
            {invoice.client.address && (
              <p>
                {[invoice.client.address, invoice.client.city, invoice.client.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {invoice.client.phone && <p>{invoice.client.phone}</p>}
            {invoice.client.email && <p>{invoice.client.email}</p>}
          </div>
        </div>
      </div>

      {/* Line items table — plain with bottom borders */}
      <table className="w-full mb-2">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="pb-2 text-left text-sm font-bold text-slate-900">Aprašymas</th>
            <th className="pb-2 text-center text-sm font-bold text-slate-900 w-20">Kiekis</th>
            <th className="pb-2 text-right text-sm font-bold text-slate-900 w-28">Kaina</th>
            <th className="pb-2 text-right text-sm font-bold text-slate-900 w-28">Suma</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-slate-200">
              <td className="py-2.5 text-sm text-slate-700">{item.description}</td>
              <td className="py-2.5 text-center text-sm text-slate-700">{Number(item.quantity)}</td>
              <td className="py-2.5 text-right text-sm text-slate-700">{formatCurrency(item.unitPrice, invoice.currency)}</td>
              <td className="py-2.5 text-right text-sm text-slate-700">{formatCurrency(item.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals — right-aligned, bold */}
      <div className="flex justify-end mt-4 mb-10">
        <div className="space-y-1">
          {(invoice.taxTotal > 0 || invoice.discountTotal > 0) && (
            <>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-slate-600">Tarpinė suma</span>
                <span className="text-slate-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxTotal > 0 && (
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-slate-600">PVM</span>
                  <span className="text-slate-900">{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
                </div>
              )}
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-slate-600">Nuolaida</span>
                  <span className="text-red-600">-{formatCurrency(invoice.discountTotal, invoice.currency)}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between gap-8 text-sm font-bold text-slate-900">
            <span>Viso</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {t.showNotes && invoice.notes && (
        <p className="text-sm text-slate-600 italic mb-8">{invoice.notes}</p>
      )}

      {/* Issuer line */}
      <p className="text-sm text-slate-600 italic mt-6">
        Sąskaitą išrašė: {user.name || user.businessName || "—"}
      </p>

      {t.footerText && (
        <div className="mt-8 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">{t.footerText}</p>
        </div>
      )}
    </>
  );
}

// ─── Main Preview ───────────────────────────────────────────────────────────

export function InvoicePreview({ invoice, user, template: templateProp }: InvoicePreviewProps) {
  const t = { ...DEFAULT_INVOICE_TEMPLATE, ...templateProp };
  const fontFamily = FONT_FAMILIES[t.fontFamily] ?? FONT_FAMILIES.default;

  return (
    <div
      className="rounded-xl border border-[#E8ECF1] bg-white p-10 max-w-3xl mx-auto shadow-sm"
      style={{ fontFamily }}
    >
      {t.layout === "modern" && <ModernLayout invoice={invoice} user={user} t={t} />}
      {t.layout === "minimal" && <MinimalLayout invoice={invoice} user={user} t={t} />}
      {t.layout === "classic" && <ClassicLayout invoice={invoice} user={user} t={t} />}
      {t.layout === "formal" && <FormalLayout invoice={invoice} user={user} t={t} />}
    </div>
  );
}
