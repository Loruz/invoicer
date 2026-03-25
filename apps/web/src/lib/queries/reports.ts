import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function getInvoiceStats(userId: string) {
  const [stats] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      invoiceCount: sql<number>`COUNT(*)`,
      paidCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'paid' THEN 1 END)`,
      paidTotal: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
      overdueTotal: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'overdue' THEN ${invoices.total} ELSE 0 END), 0)`,
      overdueCount: sql<number>`COUNT(CASE WHEN ${invoices.status} = 'overdue' THEN 1 END)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  return stats;
}

export async function getMonthlyRevenue(userId: string) {
  return db
    .select({
      month: sql<string>`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`,
      monthLabel: sql<string>`TO_CHAR(${invoices.issueDate}, 'Mon')`,
      total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      paid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, userId),
        sql`${invoices.issueDate} >= NOW() - INTERVAL '6 months'`
      )
    )
    .groupBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`, sql`TO_CHAR(${invoices.issueDate}, 'Mon')`)
    .orderBy(sql`TO_CHAR(${invoices.issueDate}, 'YYYY-MM')`);
}

export async function getRevenueByClient(userId: string, limit = 5) {
  return db
    .select({
      clientName: clients.companyName,
      total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.userId, userId))
    .groupBy(clients.id, clients.companyName)
    .orderBy(desc(sql`SUM(${invoices.total})`))
    .limit(limit);
}
