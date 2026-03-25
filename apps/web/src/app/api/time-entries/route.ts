import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { timeEntries, projects } from "@/db/schema";
import { eq, and, desc, gte, lte, isNull, inArray } from "drizzle-orm";
import { createTimeEntrySchema } from "@invoicer/shared";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);

    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const unbilled = searchParams.get("unbilled");

    const conditions = [eq(timeEntries.userId, user.id)];

    if (projectId) {
      conditions.push(eq(timeEntries.projectId, projectId));
    }

    // Filter by clientId: find all projects for that client, then filter entries
    if (clientId) {
      const clientProjects = await db.query.projects.findMany({
        where: and(eq(projects.clientId, clientId), eq(projects.userId, user.id)),
        columns: { id: true },
      });
      const projectIds = clientProjects.map((p) => p.id);
      if (projectIds.length === 0) {
        return NextResponse.json([]);
      }
      conditions.push(inArray(timeEntries.projectId, projectIds));
    }

    if (from) {
      conditions.push(gte(timeEntries.startTime, new Date(from)));
    }
    if (to) {
      conditions.push(lte(timeEntries.startTime, new Date(to)));
    }

    // Filter unbilled entries (not linked to any invoice)
    if (unbilled === "true") {
      conditions.push(isNull(timeEntries.invoiceId));
    }

    const entries = await db.query.timeEntries.findMany({
      where: and(...conditions),
      orderBy: [desc(timeEntries.startTime)],
      with: {
        project: {
          with: {
            client: true,
          },
        },
        invoice: {
          columns: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const data = createTimeEntrySchema.parse(body);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const duration = Math.floor(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    if (duration < 0) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const [entry] = await db
      .insert(timeEntries)
      .values({
        userId: user.id,
        projectId: data.projectId,
        description: data.description ?? null,
        startTime,
        endTime,
        duration,
        billable: data.billable,
      })
      .returning();

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
