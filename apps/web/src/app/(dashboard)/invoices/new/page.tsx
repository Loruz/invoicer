import { getAuthenticatedUser } from "@/lib/auth";
import { getInvoiceDetail } from "@/lib/queries/invoices";
import { getNextInvoiceNumber } from "@/lib/invoice-number";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { notFound } from "next/navigation";

interface NewInvoicePageProps {
  searchParams: Promise<{ clientId?: string; from?: string }>;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shiftDueDate(
  sourceIssue: Date,
  sourceDue: Date | null,
  newIssue: Date
): Date | null {
  if (!sourceDue) return null;
  const deltaMs = sourceDue.getTime() - sourceIssue.getTime();
  if (deltaMs < 0) return null;
  return new Date(newIssue.getTime() + deltaMs);
}

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const { clientId, from } = await searchParams;
  const user = await getAuthenticatedUser();

  if (from) {
    if (!UUID_RE.test(from)) {
      notFound();
    }
    const source = await getInvoiceDetail(from, user.id);
    if (!source) {
      notFound();
    }

    const issueDate = new Date();
    const dueDate = shiftDueDate(
      new Date(source.issueDate),
      source.dueDate ? new Date(source.dueDate) : null,
      issueDate
    );

    const invoiceNumber = await getNextInvoiceNumber(
      user.id,
      source.invoiceNumber
    );

    return (
      <InvoiceForm
        initialData={{
          invoiceNumber,
          clientId: source.clientId,
          currency: source.currency,
          issueDate,
          dueDate,
          notes: source.notes,
          paymentTerms: source.paymentTerms,
          lineItems: source.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: li.taxRate,
            timeEntryId: null,
            sortOrder: li.sortOrder,
          })),
          discounts: source.discounts.map((d) => ({
            description: d.description,
            type: d.type,
            value: Number(d.value),
            amount: d.amount,
          })),
        }}
      />
    );
  }

  return <InvoiceForm defaultClientId={clientId} />;
}
