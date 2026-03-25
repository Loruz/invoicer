import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getAllInvoices(userId: string) {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: desc(invoices.createdAt),
    with: { client: true },
  });
}

export async function getInvoiceDetail(invoiceId: string, userId: string) {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
    with: {
      client: true,
      lineItems: true,
      discounts: true,
    },
  });
}
