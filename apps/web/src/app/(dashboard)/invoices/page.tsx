import { getAuthenticatedUser } from "@/lib/auth";
import { getAllInvoices } from "@/lib/queries/invoices";
import { InvoiceList } from "@/components/invoices/invoice-list";

export default async function InvoicesPage() {
  const user = await getAuthenticatedUser();
  const invoiceList = await getAllInvoices(user.id);

  return <InvoiceList invoices={invoiceList} />;
}
