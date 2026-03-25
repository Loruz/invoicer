import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  clients,
  projects,
  timeEntries,
  invoices,
  invoiceLineItems,
  invoiceDiscounts,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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

    // Get all projects for this client
    const clientProjects = await db.query.projects.findMany({
      where: and(eq(projects.clientId, clientId), eq(projects.userId, user.id)),
      columns: { id: true },
    });
    const projectIds = clientProjects.map((p) => p.id);

    // Get all invoices for this client
    const clientInvoices = await db.query.invoices.findMany({
      where: and(eq(invoices.clientId, clientId), eq(invoices.userId, user.id)),
      columns: { id: true },
    });
    const invoiceIds = clientInvoices.map((i) => i.id);

    // Delete invoice line items and discounts
    if (invoiceIds.length > 0) {
      await db
        .delete(invoiceLineItems)
        .where(inArray(invoiceLineItems.invoiceId, invoiceIds));
      await db
        .delete(invoiceDiscounts)
        .where(inArray(invoiceDiscounts.invoiceId, invoiceIds));
    }

    // Unlink time entries from invoices, then delete time entries for client projects
    if (projectIds.length > 0) {
      await db
        .delete(timeEntries)
        .where(
          and(
            inArray(timeEntries.projectId, projectIds),
            eq(timeEntries.userId, user.id)
          )
        );
    }

    // Delete invoices
    if (invoiceIds.length > 0) {
      await db
        .delete(invoices)
        .where(
          and(eq(invoices.clientId, clientId), eq(invoices.userId, user.id))
        );
    }

    // Delete projects
    await db
      .delete(projects)
      .where(
        and(eq(projects.clientId, clientId), eq(projects.userId, user.id))
      );

    // Delete client
    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, user.id)))
      .returning();

    return NextResponse.json(deleted);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
