import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { InvoiceList } from "@/components/invoices/invoice-list";

export default async function InvoicesPage() {
  const user = await getAuthenticatedUser();
  const invoiceList = await db.query.invoices.findMany({
    where: eq(invoices.userId, user.id),
    orderBy: desc(invoices.createdAt),
    with: { client: true },
  });

  return <InvoiceList invoices={invoiceList} />;
}
