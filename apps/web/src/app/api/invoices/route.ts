import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  invoices,
  invoiceLineItems,
  invoiceDiscounts,
  timeEntries,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createInvoiceSchema } from "@invoicer/shared";

async function generateInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const existing = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    columns: { invoiceNumber: true },
  });
  const yearInvoices = existing.filter((i) =>
    i.invoiceNumber.startsWith(`INV-${year}-`)
  );
  const nextNum = yearInvoices.length + 1;
  return `INV-${year}-${nextNum.toString().padStart(4, "0")}`;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const conditions = [eq(invoices.userId, user.id)];
    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (clientId) {
      conditions.push(eq(invoices.clientId, clientId));
    }

    const result = await db.query.invoices.findMany({
      where: and(...conditions),
      with: { client: true },
      orderBy: [desc(invoices.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const data = createInvoiceSchema.parse(body);

    const invoiceNumber = await generateInvoiceNumber(user.id);

    // Calculate line item amounts
    const calculatedLineItems = data.lineItems.map((item, index) => {
      const amount = Math.round(item.quantity * item.unitPrice);
      const taxAmount = Math.round((amount * (item.taxRate ?? 0)) / 100);
      return {
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice,
        amount,
        taxRate: (item.taxRate ?? 0).toString(),
        taxAmount,
        timeEntryId: item.timeEntryId ?? null,
        sortOrder: item.sortOrder ?? index,
      };
    });

    const subtotal = calculatedLineItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const taxTotal = calculatedLineItems.reduce(
      (sum, item) => sum + item.taxAmount,
      0
    );

    // Calculate discounts
    const calculatedDiscounts = (data.discounts ?? []).map((discount) => {
      const amount =
        discount.type === "percentage"
          ? Math.round((subtotal * discount.value) / 100)
          : Math.round(discount.value);
      return {
        description: discount.description,
        type: discount.type,
        value: discount.value.toString(),
        amount,
      };
    });

    const discountTotal = calculatedDiscounts.reduce(
      (sum, d) => sum + d.amount,
      0
    );
    const total = subtotal + taxTotal - discountTotal;

    // Insert the invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: user.id,
        clientId: data.clientId,
        invoiceNumber,
        status: "draft",
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        currency: data.currency,
        subtotal,
        taxTotal,
        discountTotal,
        total,
        notes: data.notes,
        paymentTerms: data.paymentTerms,
      })
      .returning();

    // Insert line items
    if (calculatedLineItems.length > 0) {
      await db.insert(invoiceLineItems).values(
        calculatedLineItems.map((item) => ({
          invoiceId: invoice.id,
          ...item,
        }))
      );
    }

    // Insert discounts
    if (calculatedDiscounts.length > 0) {
      await db.insert(invoiceDiscounts).values(
        calculatedDiscounts.map((discount) => ({
          invoiceId: invoice.id,
          ...discount,
        }))
      );
    }

    // Link time entries to the invoice
    const timeEntryIds = calculatedLineItems
      .map((item) => item.timeEntryId)
      .filter((id): id is string => id !== null);

    for (const timeEntryId of timeEntryIds) {
      await db
        .update(timeEntries)
        .set({ invoiceId: invoice.id })
        .where(
          and(
            eq(timeEntries.id, timeEntryId),
            eq(timeEntries.userId, user.id)
          )
        );
    }

    // Return the full invoice with relations
    const fullInvoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoice.id),
      with: { client: true, lineItems: true, discounts: true },
    });

    return NextResponse.json(fullInvoice, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
