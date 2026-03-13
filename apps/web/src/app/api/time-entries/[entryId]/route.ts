import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTimeEntrySchema } from "@invoicer/shared";

async function getEntry(userId: string, entryId: string) {
  return db.query.timeEntries.findFirst({
    where: and(eq(timeEntries.id, entryId), eq(timeEntries.userId, userId)),
    with: {
      project: {
        with: {
          client: true,
        },
      },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { entryId } = await params;

    const entry = await getEntry(user.id, entryId);

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { entryId } = await params;

    const existing = await getEntry(user.id, entryId);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateTimeEntrySchema.parse(body);

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.projectId !== undefined) updates.projectId = data.projectId;
    if (data.description !== undefined) updates.description = data.description;
    if (data.billable !== undefined) updates.billable = data.billable;

    // Determine final start/end times for duration recomputation
    const newStartTime = data.startTime
      ? new Date(data.startTime)
      : existing.startTime;
    const newEndTime = data.endTime
      ? new Date(data.endTime)
      : existing.endTime;

    if (data.startTime) updates.startTime = newStartTime;
    if (data.endTime) updates.endTime = newEndTime;

    // Recompute duration if both start and end times are available
    if (newStartTime && newEndTime) {
      updates.duration = Math.floor(
        (newEndTime.getTime() - newStartTime.getTime()) / 1000
      );
    }

    const [entry] = await db
      .update(timeEntries)
      .set(updates)
      .where(
        and(eq(timeEntries.id, entryId), eq(timeEntries.userId, user.id))
      )
      .returning();

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { entryId } = await params;

    const existing = await getEntry(user.id, entryId);

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .delete(timeEntries)
      .where(
        and(eq(timeEntries.id, entryId), eq(timeEntries.userId, user.id))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
