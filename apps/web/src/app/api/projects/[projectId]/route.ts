import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { projects, timeEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateProjectSchema } from "@invoicer/shared";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    const { projectId } = await params;

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
      with: {
        client: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    const { projectId } = await params;

    const existing = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    const [updated] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    const { projectId } = await params;

    const existing = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete associated time entries first to avoid FK constraint
    await db
      .delete(timeEntries)
      .where(
        and(
          eq(timeEntries.projectId, projectId),
          eq(timeEntries.userId, user.id)
        )
      );

    // Delete the project
    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .returning();

    return NextResponse.json(deleted);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
