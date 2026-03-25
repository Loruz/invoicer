import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function getAllClients(userId: string) {
  return db.query.clients.findMany({
    where: eq(clients.userId, userId),
    orderBy: desc(clients.createdAt),
    with: { projects: true, invoices: true },
  });
}

export async function getClientDetail(clientId: string, userId: string) {
  return db.query.clients.findFirst({
    where: and(eq(clients.id, clientId), eq(clients.userId, userId)),
  });
}

export async function getClientProjects(clientId: string, userId: string) {
  return db.query.projects.findMany({
    where: and(eq(projects.clientId, clientId), eq(projects.userId, userId)),
    orderBy: desc(projects.createdAt),
  });
}

export async function getClientCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.userId, userId));
  return Number(result?.count) || 0;
}
