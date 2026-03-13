import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";

interface EditInvoicePageProps {
  params: Promise<{ invoiceId: string }>;
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
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
      <h1 className="text-2xl font-bold mb-6">
        Edit Invoice {invoice.invoiceNumber}
      </h1>
      <InvoiceForm initialData={invoice} invoiceId={invoice.id} />
    </div>
  );
}
