"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, FileText } from "lucide-react";
import { formatCurrency } from "@invoicer/shared";
import type { Client } from "@invoicer/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  total: number;
  client: Client;
}

interface InvoiceListProps {
  invoices: InvoiceWithClient[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    sent: "bg-blue-50 text-blue-600",
    pending: "bg-amber-50 text-amber-600",
    paid: "bg-emerald-50 text-emerald-600",
    overdue: "bg-red-50 text-red-600",
    cancelled: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || styles.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  // Stats
  const totalInvoiced = invoices.reduce((s, inv) => s + inv.total, 0);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total, 0);
  const pendingTotal = invoices
    .filter((i) => i.status === "sent" || i.status === "draft")
    .reduce((s, i) => s + i.total, 0);
  const overdueTotal = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.total, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage all your invoices in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="border-0 bg-transparent text-sm text-slate-600 placeholder-slate-400 outline-none"
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => { if (val !== null) setStatusFilter(val); }}>
            <SelectTrigger className="rounded-lg border border-[#E8ECF1] bg-white px-3 py-2 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350] transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Total Invoiced</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(totalInvoiced, "USD")}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatCurrency(paidTotal, "USD")}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-500">
            {formatCurrency(pendingTotal, "USD")}
          </p>
        </div>
        <div className="rounded-xl border border-[#E8ECF1] bg-white p-5">
          <p className="text-sm text-slate-500">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-500">
            {formatCurrency(overdueTotal, "USD")}
          </p>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-[#E8ECF1] bg-white">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">No invoices found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E8ECF1]">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-[#E8ECF1] last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {invoice.client.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm ${
                      invoice.status === "overdue"
                        ? "text-red-500 font-medium"
                        : "text-slate-500"
                    }`}
                  >
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8ECF1] text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        <FileText className="h-3 w-3" />
                        PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
