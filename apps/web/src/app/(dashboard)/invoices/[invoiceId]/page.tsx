import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceStatusActions } from "@/components/invoices/invoice-status-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Pencil, Download, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@invoicer/shared";
import type { InvoiceStatus } from "@invoicer/shared";

interface InvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "sent":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Sent
        </Badge>
      );
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Paid
        </Badge>
      );
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
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
      <div className="flex items-center gap-2 mb-6">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === "draft" && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="mr-1 h-4 w-4" />
              Download PDF
            </Button>
          </a>
          <InvoiceStatusActions
            invoiceId={invoice.id}
            currentStatus={invoice.status as InvoiceStatus}
          />
        </div>
      </div>

      <Separator className="mb-6" />

      <InvoicePreview invoice={invoice} user={user} />
    </div>
  );
}
