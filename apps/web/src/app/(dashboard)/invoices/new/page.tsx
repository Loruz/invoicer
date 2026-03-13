import { InvoiceForm } from "@/components/invoices/invoice-form";

interface NewInvoicePageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const { clientId } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Invoice</h1>
      <InvoiceForm defaultClientId={clientId} />
    </div>
  );
}
