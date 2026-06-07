import { formatCurrency } from "@invoicer/shared";
import type { InvoiceTemplate } from "@invoicer/shared";
import { DEFAULT_INVOICE_TEMPLATE } from "@invoicer/shared";

type InvoiceData = {
  invoiceNumber: string;
  status: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  client: {
    companyName: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    postalCode: string | null;
    taxId: string | null;
  };
  lineItems: Array<{
    description: string;
    quantity: string | number;
    unitPrice: number;
    amount: number;
    taxRate: string | number;
    taxAmount: number;
    sortOrder: number;
  }>;
  discounts: Array<{
    description: string;
    type: string;
    value: string | number;
    amount: number;
  }>;
};

type UserData = {
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
};

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function clientAddress(client: InvoiceData["client"]): string {
  return [client.address, client.city, client.country].filter(Boolean).join(", ");
}

function bankDetailsHtml(user: UserData, t: InvoiceTemplate, cls: string): string {
  if (!t.showBankDetails || (!user.bankName && !user.bankAccount)) return "";
  const lines: string[] = [];
  if (user.bankName) lines.push(`Bankas: ${esc(user.bankName)}`);
  if (user.bankCode) lines.push(`Banko kodas: ${esc(user.bankCode)}`);
  if (user.bankSwift) lines.push(`SWIFT: ${esc(user.bankSwift)}`);
  if (user.bankAccount) lines.push(`Sąskaita: ${esc(user.bankAccount)}`);
  return `<div class="${cls} space-y-0.5 mt-2">${lines.map((l) => `<p>${l}</p>`).join("")}</div>`;
}

function sellerInfoLines(user: UserData, t: InvoiceTemplate, cls: string): string {
  const lines: string[] = [];
  if (user.businessEntity) lines.push(esc(user.businessEntity));
  if (user.companyCode) lines.push(`Įmonės kodas: ${esc(user.companyCode)}`);
  if (t.showTaxId && user.taxId) lines.push(`PVM kodas: ${esc(user.taxId)}`);
  if (user.businessAddress) lines.push(esc(user.businessAddress));
  if (user.businessPhone) lines.push(esc(user.businessPhone));
  if (user.businessEmail || user.email) lines.push(esc(user.businessEmail || user.email));
  return lines.map((l) => `<p class="${cls}">${l}</p>`).join("");
}

function totalsHtml(invoice: InvoiceData, t: InvoiceTemplate): string {
  let html = "";
  if (invoice.taxTotal > 0 || invoice.discountTotal > 0) {
    html += `<div class="flex justify-between gap-8 text-sm"><span class="text-slate-600">Tarpinė suma</span><span class="text-slate-900">${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>`;
    if (invoice.taxTotal > 0) {
      html += `<div class="flex justify-between gap-8 text-sm"><span class="text-slate-600">PVM</span><span class="text-slate-900">${formatCurrency(invoice.taxTotal, invoice.currency)}</span></div>`;
    }
    if (invoice.discountTotal > 0) {
      html += `<div class="flex justify-between gap-8 text-sm"><span class="text-slate-600">Nuolaida</span><span class="text-red-600">-${formatCurrency(invoice.discountTotal, invoice.currency)}</span></div>`;
    }
  }
  html += `<div class="flex justify-between gap-8 text-sm font-bold text-slate-900"><span>Viso</span><span>${formatCurrency(invoice.total, invoice.currency)}</span></div>`;
  return html;
}

function tableRowsHtml(invoice: InvoiceData): string {
  const sorted = [...invoice.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted
    .map(
      (item) => `
    <tr class="border-b border-slate-200">
      <td class="py-2.5 text-sm text-slate-700">${esc(item.description)}</td>
      <td class="py-2.5 text-center text-sm text-slate-700">${item.quantity}</td>
      <td class="py-2.5 text-right text-sm text-slate-700">${formatCurrency(item.unitPrice, invoice.currency)}</td>
      <td class="py-2.5 text-right text-sm text-slate-700">${formatCurrency(item.amount, invoice.currency)}</td>
    </tr>`
    )
    .join("");
}

// ─── Formal Layout ──────────────────────────────────────────────────────────

function formalHtml(invoice: InvoiceData, user: UserData, t: InvoiceTemplate): string {
  return `
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-900 uppercase tracking-wide mb-4">Sąskaita faktūra</h1>
      <div class="text-sm text-slate-600 space-y-0.5">
        <p>Nr. ${esc(invoice.invoiceNumber)}</p>
        <p>Sąskaitos data ${formatDate(invoice.issueDate)}</p>
        ${invoice.dueDate ? `<p>Apmokėti iki ${formatDate(invoice.dueDate)}</p>` : ""}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-10 mb-10">
      <div>
        <p class="text-base font-bold text-slate-900 mb-2">Pardavėjas</p>
        <div class="text-sm text-slate-700 space-y-0.5">
          <p>${esc(user.businessName || user.name || "")}</p>
          ${sellerInfoLines(user, t, "")}
          ${bankDetailsHtml(user, t, "text-sm text-slate-700")}
        </div>
        ${t.showPaymentTerms && invoice.paymentTerms ? `<p class="text-sm text-slate-700 whitespace-pre-line mt-3">${esc(invoice.paymentTerms)}</p>` : ""}
      </div>
      <div>
        <p class="text-base font-bold text-slate-900 mb-2">Pirkėjas</p>
        <div class="text-sm text-slate-700 space-y-0.5">
          <p>${esc(invoice.client.companyName)}</p>
          ${invoice.client.taxId ? `<p>${esc(invoice.client.taxId)}</p>` : ""}
          ${clientAddress(invoice.client) ? `<p>${esc(clientAddress(invoice.client))}</p>` : ""}
          ${invoice.client.phone ? `<p>${esc(invoice.client.phone)}</p>` : ""}
          ${invoice.client.email ? `<p>${esc(invoice.client.email)}</p>` : ""}
        </div>
      </div>
    </div>
    <table class="w-full mb-2">
      <thead>
        <tr class="border-b-2 border-slate-900">
          <th class="pb-2 text-left text-sm font-bold text-slate-900">Aprašymas</th>
          <th class="pb-2 text-center text-sm font-bold text-slate-900 w-20">Kiekis</th>
          <th class="pb-2 text-right text-sm font-bold text-slate-900 w-28">Kaina</th>
          <th class="pb-2 text-right text-sm font-bold text-slate-900 w-28">Suma</th>
        </tr>
      </thead>
      <tbody>${tableRowsHtml(invoice)}</tbody>
    </table>
    <div class="flex justify-end mt-4 mb-10"><div class="space-y-1">${totalsHtml(invoice, t)}</div></div>
    ${t.showNotes && invoice.notes ? `<p class="text-sm text-slate-600 mb-8">${esc(invoice.notes)}</p>` : ""}
    <p class="text-sm text-slate-600 mt-6">Sąskaitą išrašė: ${esc(user.name || user.businessName || "—")}</p>
    ${t.footerText ? `<div class="mt-8 pt-4 border-t border-slate-200 text-center"><p class="text-xs text-slate-400">${esc(t.footerText)}</p></div>` : ""}`;
}

// ─── Classic Layout ─────────────────────────────────────────────────────────

function classicHtml(invoice: InvoiceData, user: UserData, t: InvoiceTemplate): string {
  return `
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-base font-bold text-slate-900">${esc(user.businessName || user.name || "")}</span>
        </div>
        ${sellerInfoLines(user, t, "text-sm text-slate-500")}
        ${bankDetailsHtml(user, t, "text-sm text-slate-500")}
      </div>
      <div class="text-right">
        <h1 class="text-3xl font-bold tracking-tight text-slate-300">SĄSKAITA FAKTŪRA</h1>
        <p class="text-sm font-medium" style="color: ${t.primaryColor}">
          #${esc(invoice.invoiceNumber)}
        </p>
      </div>
    </div>
    <div class="flex justify-between mb-10">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider mb-1" style="color: ${t.primaryColor}">Pirkėjas</p>
        <h3 class="text-base font-semibold text-slate-900">${esc(invoice.client.companyName)}</h3>
        ${invoice.client.contactName ? `<p class="text-sm text-slate-500">${esc(invoice.client.contactName)}</p>` : ""}
        ${invoice.client.email ? `<p class="text-sm text-slate-500">${esc(invoice.client.email)}</p>` : ""}
        ${clientAddress(invoice.client) ? `<p class="text-sm text-slate-500">${esc(clientAddress(invoice.client))}</p>` : ""}
      </div>
      <div class="text-right text-sm space-y-1">
        <div><span class="text-slate-400">Išrašymo data</span><span class="ml-4 font-medium text-slate-900">${formatDate(invoice.issueDate)}</span></div>
        <div><span class="text-slate-400">Apmokėjimo data</span><span class="ml-4 font-medium text-slate-900">${formatDate(invoice.dueDate)}</span></div>
      </div>
    </div>
    <table class="w-full mb-6">
      <thead><tr style="border-bottom: 2px solid ${t.primaryColor}20">
        <th class="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Aprašymas</th>
        <th class="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Kiekis</th>
        <th class="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Kaina</th>
        <th class="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Suma</th>
      </tr></thead>
      <tbody>${tableRowsHtml(invoice)}</tbody>
    </table>
    <div class="flex justify-end mb-8"><div class="w-64 space-y-2">
      <div class="flex justify-between text-sm"><span class="text-slate-400">Tarpinė suma</span><span class="text-slate-900">${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
      ${invoice.taxTotal > 0 ? `<div class="flex justify-between text-sm"><span class="text-slate-400">PVM</span><span class="text-slate-900">${formatCurrency(invoice.taxTotal, invoice.currency)}</span></div>` : ""}
      ${invoice.discountTotal > 0 ? `<div class="flex justify-between text-sm"><span class="text-slate-400">Nuolaida</span><span class="text-red-500">-${formatCurrency(invoice.discountTotal, invoice.currency)}</span></div>` : ""}
      <div class="border-t border-slate-200 pt-2 flex justify-between">
        <span class="text-sm font-bold text-slate-900">Mokėti</span>
        <span class="text-lg font-bold" style="color: ${t.accentColor}">${formatCurrency(invoice.total, invoice.currency)}</span>
      </div>
    </div></div>
    ${(t.showPaymentTerms && invoice.paymentTerms) || (t.showNotes && invoice.notes) ? `
      <div class="border-t border-slate-200 pt-6">
        <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: ${t.primaryColor}">Mokėjimo informacija</p>
        ${t.showPaymentTerms && invoice.paymentTerms ? `<p class="text-sm text-slate-500 whitespace-pre-line">${esc(invoice.paymentTerms)}</p>` : ""}
        ${t.showNotes && invoice.notes ? `<p class="text-sm text-slate-500 whitespace-pre-line mt-1">${esc(invoice.notes)}</p>` : ""}
      </div>` : ""}
    ${t.footerText ? `<div class="mt-8 pt-4 border-t border-slate-100 text-center"><p class="text-xs text-slate-400">${esc(t.footerText)}</p></div>` : ""}`;
}

// ─── Modern Layout ──────────────────────────────────────────────────────────

function modernHtml(invoice: InvoiceData, user: UserData, t: InvoiceTemplate): string {
  return `
    <div class="rounded-lg px-6 py-5 mb-8 flex items-start justify-between" style="background-color: ${t.primaryColor}">
      <div>
        <h1 class="text-2xl font-bold text-white/90">SĄSKAITA FAKTŪRA</h1>
        <p class="text-sm text-white/70 mt-0.5">#${esc(invoice.invoiceNumber)}</p>
      </div>
      <div class="text-right text-sm text-white/80 space-y-0.5">
        <div>Išrašyta: ${formatDate(invoice.issueDate)}</div>
        <div>Apmokėti iki: ${formatDate(invoice.dueDate)}</div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-8 mb-10">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pardavėjas</p>
        <p class="text-sm font-semibold text-slate-900">${esc(user.businessName || user.name || "")}</p>
        ${sellerInfoLines(user, t, "text-sm text-slate-500")}
        ${bankDetailsHtml(user, t, "text-sm text-slate-500")}
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pirkėjas</p>
        <p class="text-sm font-semibold text-slate-900">${esc(invoice.client.companyName)}</p>
        ${invoice.client.contactName ? `<p class="text-sm text-slate-500">${esc(invoice.client.contactName)}</p>` : ""}
        ${invoice.client.email ? `<p class="text-sm text-slate-500">${esc(invoice.client.email)}</p>` : ""}
        ${clientAddress(invoice.client) ? `<p class="text-sm text-slate-500">${esc(clientAddress(invoice.client))}</p>` : ""}
      </div>
    </div>
    <table class="w-full mb-6">
      <thead><tr>
        <th class="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-white rounded-l-md" style="background-color: ${t.primaryColor}">Aprašymas</th>
        <th class="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white" style="background-color: ${t.primaryColor}">Kiekis</th>
        <th class="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white" style="background-color: ${t.primaryColor}">Kaina</th>
        <th class="py-2.5 px-3 text-right text-xs font-semibold uppercase tracking-wider text-white rounded-r-md" style="background-color: ${t.primaryColor}">Suma</th>
      </tr></thead>
      <tbody>${tableRowsHtml(invoice)}</tbody>
    </table>
    <div class="flex justify-end mb-8"><div class="w-64 space-y-2">
      <div class="flex justify-between text-sm"><span class="text-slate-400">Tarpinė suma</span><span class="text-slate-900">${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
      ${invoice.taxTotal > 0 ? `<div class="flex justify-between text-sm"><span class="text-slate-400">PVM</span><span class="text-slate-900">${formatCurrency(invoice.taxTotal, invoice.currency)}</span></div>` : ""}
      ${invoice.discountTotal > 0 ? `<div class="flex justify-between text-sm"><span class="text-slate-400">Nuolaida</span><span class="text-red-500">-${formatCurrency(invoice.discountTotal, invoice.currency)}</span></div>` : ""}
      <div class="border-t border-slate-200 pt-2 flex justify-between">
        <span class="text-sm font-bold text-slate-900">Mokėti</span>
        <span class="text-lg font-bold" style="color: ${t.accentColor}">${formatCurrency(invoice.total, invoice.currency)}</span>
      </div>
    </div></div>
    ${(t.showPaymentTerms && invoice.paymentTerms) || (t.showNotes && invoice.notes) ? `
      <div class="border-t border-slate-200 pt-6">
        <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: ${t.primaryColor}">Mokėjimo informacija</p>
        ${t.showPaymentTerms && invoice.paymentTerms ? `<p class="text-sm text-slate-500 whitespace-pre-line">${esc(invoice.paymentTerms)}</p>` : ""}
        ${t.showNotes && invoice.notes ? `<p class="text-sm text-slate-500 whitespace-pre-line mt-1">${esc(invoice.notes)}</p>` : ""}
      </div>` : ""}
    ${t.footerText ? `<div class="mt-8 pt-4 border-t border-slate-100 text-center"><p class="text-xs text-slate-400">${esc(t.footerText)}</p></div>` : ""}`;
}

// ─── Minimal Layout ─────────────────────────────────────────────────────────

function minimalHtml(invoice: InvoiceData, user: UserData, t: InvoiceTemplate): string {
  return `
    <div class="flex justify-between items-start mb-12">
      <div>
        ${t.showLogo && !t.logoUrl ? `<div class="h-1 w-10 rounded-full mb-6" style="background-color: ${t.accentColor}"></div>` : ""}
        ${t.showLogo && t.logoUrl ? `<img src="${esc(t.logoUrl)}" alt="Logo" class="h-8 w-8 rounded object-contain mb-6" />` : ""}
        <p class="text-sm text-slate-900 font-medium">${esc(user.businessName || user.name || "")}</p>
        ${user.businessEntity ? `<p class="text-xs text-slate-400 mt-0.5">${esc(user.businessEntity)}</p>` : ""}
        ${user.companyCode ? `<p class="text-xs text-slate-400">${esc(user.companyCode)}</p>` : ""}
        ${t.showTaxId && user.taxId ? `<p class="text-xs text-slate-400">${esc(user.taxId)}</p>` : ""}
        ${user.businessAddress ? `<p class="text-xs text-slate-400 whitespace-pre-line mt-1">${esc(user.businessAddress)}</p>` : ""}
        ${user.businessEmail || user.email ? `<p class="text-xs text-slate-400">${esc(user.businessEmail || user.email)}</p>` : ""}
        ${bankDetailsHtml(user, t, "text-xs text-slate-400")}
      </div>
      <div class="text-right">
        <p class="text-xs text-slate-400 uppercase tracking-widest">Sąskaita faktūra</p>
        <p class="text-sm text-slate-600 mt-0.5">${esc(invoice.invoiceNumber)}</p>
        <p class="text-xs text-slate-400 mt-3">${formatDate(invoice.issueDate)}</p>
        <p class="text-xs text-slate-400">Apmokėti iki ${formatDate(invoice.dueDate)}</p>
      </div>
    </div>
    <div class="mb-10">
      <p class="text-xs text-slate-400 mb-1">Pirkėjas</p>
      <p class="text-sm text-slate-900">${esc(invoice.client.companyName)}</p>
      ${invoice.client.email ? `<p class="text-xs text-slate-400">${esc(invoice.client.email)}</p>` : ""}
      ${clientAddress(invoice.client) ? `<p class="text-xs text-slate-400">${esc(clientAddress(invoice.client))}</p>` : ""}
    </div>
    <table class="w-full mb-8">
      <thead><tr class="border-b border-slate-200">
        <th class="pb-2 text-left text-xs font-normal text-slate-400">Aprašymas</th>
        <th class="pb-2 text-right text-xs font-normal text-slate-400">Kiekis</th>
        <th class="pb-2 text-right text-xs font-normal text-slate-400">Kaina</th>
        <th class="pb-2 text-right text-xs font-normal text-slate-400">Suma</th>
      </tr></thead>
      <tbody>${tableRowsHtml(invoice)}</tbody>
    </table>
    <div class="flex justify-end mb-10"><div class="w-56 space-y-1.5">
      <div class="flex justify-between text-xs"><span class="text-slate-400">Tarpinė suma</span><span class="text-slate-600">${formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
      ${invoice.taxTotal > 0 ? `<div class="flex justify-between text-xs"><span class="text-slate-400">PVM</span><span class="text-slate-600">${formatCurrency(invoice.taxTotal, invoice.currency)}</span></div>` : ""}
      ${invoice.discountTotal > 0 ? `<div class="flex justify-between text-xs"><span class="text-slate-400">Nuolaida</span><span class="text-red-400">-${formatCurrency(invoice.discountTotal, invoice.currency)}</span></div>` : ""}
      <div class="border-t border-slate-200 pt-2 flex justify-between">
        <span class="text-sm text-slate-700">Viso</span>
        <span class="text-sm font-semibold text-slate-900">${formatCurrency(invoice.total, invoice.currency)}</span>
      </div>
    </div></div>
    ${(t.showPaymentTerms && invoice.paymentTerms) || (t.showNotes && invoice.notes) ? `
      <div class="border-t border-slate-100 pt-6">
        ${t.showPaymentTerms && invoice.paymentTerms ? `<p class="text-xs text-slate-400 whitespace-pre-line">${esc(invoice.paymentTerms)}</p>` : ""}
        ${t.showNotes && invoice.notes ? `<p class="text-xs text-slate-400 whitespace-pre-line mt-1">${esc(invoice.notes)}</p>` : ""}
      </div>` : ""}
    ${t.footerText ? `<div class="mt-10 text-center"><p class="text-xs text-slate-300">${esc(t.footerText)}</p></div>` : ""}`;
}

// ─── Main Export ────────────────────────────────────────────────────────────

export function buildInvoiceHtml(
  invoice: InvoiceData,
  user: UserData,
  template: InvoiceTemplate | null
): string {
  const t = { ...DEFAULT_INVOICE_TEMPLATE, ...template };

  const fontFamilies: Record<string, string> = {
    default: "'Inter', ui-sans-serif, system-ui, sans-serif",
    serif: "'Noto Serif', Georgia, serif",
    mono: "'Roboto Mono', ui-monospace, monospace",
  };
  const fontFamily = fontFamilies[t.fontFamily] ?? fontFamilies.default;

  let body: string;
  switch (t.layout) {
    case "modern":
      body = modernHtml(invoice, user, t);
      break;
    case "minimal":
      body = minimalHtml(invoice, user, t);
      break;
    case "formal":
      body = formalHtml(invoice, user, t);
      break;
    default:
      body = classicHtml(invoice, user, t);
  }

  return `<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Serif:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${fontFamily}; -webkit-font-smoothing: antialiased; background: white; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  <div class="rounded-xl border border-[#E8ECF1] bg-white p-10 max-w-3xl mx-auto shadow-sm" style="font-family: ${fontFamily}">
    ${body}
  </div>
</body>
</html>`;
}
