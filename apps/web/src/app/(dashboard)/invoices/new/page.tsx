import { InvoiceForm } from "@/components/invoices/invoice-form";

interface NewInvoicePageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function NewInvoicePage({
  searchParams,
}: NewInvoicePageProps) {
  const { clientId } = await searchParams;

  return <InvoiceForm defaultClientId={clientId} />;
}
