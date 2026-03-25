import { db } from "@/db";
import { projects, timeEntries } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getAllProjects(userId: string) {
  return db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: desc(projects.createdAt),
    with: { client: true },
  });
}

export async function getProjectDetail(projectId: string, userId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
    with: { client: true },
  });
}

export async function getProjectForEdit(projectId: string, userId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
  });
}

export async function getProjectTimeEntries(projectId: string, userId: string, limit = 10) {
  return db.query.timeEntries.findMany({
    where: and(eq(timeEntries.projectId, projectId), eq(timeEntries.userId, userId)),
    orderBy: desc(timeEntries.startTime),
    limit,
  });
}
