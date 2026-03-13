import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClientSchema } from "@invoicer/shared";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const result = await db.query.clients.findMany({
      where: eq(clients.userId, user.id),
      orderBy: desc(clients.createdAt),
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
    const data = createClientSchema.parse(body);
    const [client] = await db
      .insert(clients)
      .values({ ...data, userId: user.id })
      .returning();
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
