import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { startTimerSchema } from "@invoicer/shared";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const data = startTimerSchema.parse(body);

    // Check for active timer
    const active = await db.query.timeEntries.findFirst({
      where: and(eq(timeEntries.userId, user.id), isNull(timeEntries.endTime)),
    });

    if (active) {
      return NextResponse.json(
        { error: "Timer already running", activeEntry: active },
        { status: 409 }
      );
    }

    const [entry] = await db
      .insert(timeEntries)
      .values({
        userId: user.id,
        projectId: data.projectId,
        description: data.description ?? null,
        startTime: new Date(),
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
