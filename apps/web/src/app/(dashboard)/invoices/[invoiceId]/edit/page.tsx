import { getAuthenticatedUser } from "@/lib/auth";
import { getInvoiceDetail } from "@/lib/queries/invoices";
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

  const invoice = await getInvoiceDetail(invoiceId, user.id);

  if (!invoice) {
    notFound();
  }

  return (
    <InvoiceForm
      initialData={{
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        paymentTerms: invoice.paymentTerms,
        lineItems: invoice.lineItems,
        discounts: invoice.discounts,
      }}
      invoiceId={invoice.id}
    />
  );
}
