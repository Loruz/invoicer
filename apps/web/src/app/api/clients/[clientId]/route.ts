import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { clients, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateClientSchema } from "@invoicer/shared";

type RouteParams = { params: Promise<{ clientId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    const { clientId } = await params;

    const client = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.userId, user.id)),
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    const { clientId } = await params;

    const existing = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = updateClientSchema.parse(body);

    const [updated] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clients.id, clientId), eq(clients.userId, user.id)))
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
    const { clientId } = await params;

    const existing = await db.query.clients.findFirst({
      where: and(eq(clients.id, clientId), eq(clients.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Delete associated projects first
    await db
      .delete(projects)
      .where(
        and(eq(projects.clientId, clientId), eq(projects.userId, user.id))
      );

    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, user.id)))
      .returning();

    return NextResponse.json(deleted);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
