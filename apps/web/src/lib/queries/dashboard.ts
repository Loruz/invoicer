import { db } from "@/db";
import { invoices, clients, timeEntries, projects } from "@/db/schema";
import { eq, and, sql, desc, isNotNull } from "drizzle-orm";

export async function getRevenueStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [stats] = await db
    .select({
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paidAt} >= ${startOfMonth} THEN ${invoices.total} ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.paidAt} >= ${startOfLastMonth} AND ${invoices.paidAt} < ${startOfMonth} THEN ${invoices.total} ELSE 0 END), 0)`,
      totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.total} ELSE 0 END), 0)`,
      pendingAmount: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} IN ('sent', 'draft') THEN ${invoices.total} ELSE 0 END), 0)`,
      pendingCount: sql<number>`COUNT(CASE WHEN ${invoices.status} IN ('sent', 'draft') THEN 1 END)`,
    })
    .from(invoices)
    .where(eq(invoices.userId, userId));

  return stats;
}

export async function getClientStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [stats] = await db
    .select({
      totalClients: sql<number>`COUNT(*)`,
      newThisMonth: sql<number>`COUNT(CASE WHEN ${clients.createdAt} >= ${startOfMonth} THEN 1 END)`,
    })
    .from(clients)
    .where(eq(clients.userId, userId));

  return stats;
}

export async function getTimeStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [stats] = await db
    .select({
      thisMonth: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.startTime} >= ${startOfMonth} THEN ${timeEntries.duration} ELSE 0 END), 0)`,
      lastMonth: sql<number>`COALESCE(SUM(CASE WHEN ${timeEntries.startTime} >= ${startOfLastMonth} AND ${timeEntries.startTime} < ${startOfMonth} THEN ${timeEntries.duration} ELSE 0 END), 0)`,
    })
    .from(timeEntries)
    .where(and(eq(timeEntries.userId, userId), isNotNull(timeEntries.duration)));

  return stats;
}

export async function getRecentInvoices(userId: string, limit = 4) {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    with: { client: true },
    orderBy: [desc(invoices.createdAt)],
    limit,
  });
}

export async function getActiveProjects(userId: string, limit = 4) {
  return db.query.projects.findMany({
    where: and(eq(projects.userId, userId), eq(projects.isActive, true)),
    with: { client: true },
    limit,
  });
}

export async function getTimeEntryCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(timeEntries)
    .where(eq(timeEntries.userId, userId));
  return Number(result?.count) || 0;
}
