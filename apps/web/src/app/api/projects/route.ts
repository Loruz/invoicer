import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createProjectSchema } from "@invoicer/shared";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const where = clientId
      ? and(eq(projects.userId, user.id), eq(projects.clientId, clientId))
      : eq(projects.userId, user.id);

    const result = await db.query.projects.findMany({
      where,
      orderBy: desc(projects.createdAt),
      with: {
        client: true,
      },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const [project] = await db
      .insert(projects)
      .values({ ...data, userId: user.id })
      .returning();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
