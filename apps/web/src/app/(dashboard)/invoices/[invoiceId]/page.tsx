import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceStatusActions } from "@/components/invoices/invoice-status-actions";
import Link from "next/link";
import { Pencil, Download, Send, ChevronLeft } from "lucide-react";
import type { InvoiceStatus } from "@invoicer/shared";

interface InvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || styles.draft
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const user = await getAuthenticatedUser();

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)),
    with: {
      client: true,
      lineItems: true,
      discounts: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="flex items-center gap-1.5 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Invoice {invoice.invoiceNumber}
          </h1>
          <StatusBadge status={invoice.status} />
        </div>
        <div className="flex items-center gap-3">
          {invoice.status === "draft" && (
            <Link
              href={`/invoices/${invoice.id}/edit`}
              className="flex items-center gap-2 rounded-lg border border-[#E8ECF1] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-[#0F3D5F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0C3350]"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            <Send className="h-4 w-4" />
            Send to Client
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <InvoicePreview invoice={invoice} user={user} template={(user as any).invoiceTemplate} />

      {/* Status Actions */}
      <div className="mt-6">
        <InvoiceStatusActions
          invoiceId={invoice.id}
          currentStatus={invoice.status as InvoiceStatus}
        />
      </div>
    </div>
  );
}
