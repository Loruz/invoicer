import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();

    // Find the active timer
    const active = await db.query.timeEntries.findFirst({
      where: and(eq(timeEntries.userId, user.id), isNull(timeEntries.endTime)),
    });

    if (!active) {
      return NextResponse.json(
        { error: "No active timer" },
        { status: 404 }
      );
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - new Date(active.startTime).getTime()) / 1000
    );

    const [entry] = await db
      .update(timeEntries)
      .set({
        endTime: now,
        duration,
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, active.id))
      .returning();

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
