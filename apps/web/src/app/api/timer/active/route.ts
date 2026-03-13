import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const active = await db.query.timeEntries.findFirst({
      where: and(eq(timeEntries.userId, user.id), isNull(timeEntries.endTime)),
      with: {
        project: {
          with: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(active ?? null);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
