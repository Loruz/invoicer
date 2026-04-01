import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  invoices,
  invoiceLineItems,
  invoiceDiscounts,
  timeEntries,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateInvoiceSchema } from "@invoicer/shared";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { invoiceId } = await params;

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)),
      with: { client: true, lineItems: true, discounts: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { invoiceId } = await params;
    const body = await req.json();
    const data = updateInvoiceSchema.parse(body);

    // Verify ownership
    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build update fields for the invoice itself
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.invoiceNumber !== undefined) {
      updateFields.invoiceNumber = data.invoiceNumber;
    }
    if (data.status !== undefined) {
      updateFields.status = data.status;
      if (data.status === "paid" && existing.status !== "paid") {
        updateFields.paidAt = new Date();
      }
    }
    if (data.issueDate !== undefined) {
      updateFields.issueDate = new Date(data.issueDate);
    }
    if (data.dueDate !== undefined) {
      updateFields.dueDate = new Date(data.dueDate);
    }
    if (data.notes !== undefined) {
      updateFields.notes = data.notes;
    }
    if (data.paymentTerms !== undefined) {
      updateFields.paymentTerms = data.paymentTerms;
    }

    // If line items are provided, recalculate totals
    if (data.lineItems) {
      // Delete existing line items
      await db
        .delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId));

      // Clear existing time entry links
      await db
        .update(timeEntries)
        .set({ invoiceId: null })
        .where(eq(timeEntries.invoiceId, invoiceId));

      // Calculate new line item amounts
      const calculatedLineItems = data.lineItems.map((item, index) => {
        const amount = Math.round(item.quantity * item.unitPrice);
        const taxAmount = Math.round((amount * (item.taxRate ?? 0)) / 100);
        return {
          invoiceId,
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

      // Handle discounts
      let calculatedDiscounts: Array<{
        invoiceId: string;
        description: string;
        type: string;
        value: string;
        amount: number;
      }> = [];

      if (data.discounts) {
        // Delete existing discounts and re-insert
        await db
          .delete(invoiceDiscounts)
          .where(eq(invoiceDiscounts.invoiceId, invoiceId));

        calculatedDiscounts = data.discounts.map((discount) => {
          const amount =
            discount.type === "percentage"
              ? Math.round((subtotal * discount.value) / 100)
              : Math.round(discount.value);
          return {
            invoiceId,
            description: discount.description,
            type: discount.type,
            value: discount.value.toString(),
            amount,
          };
        });
      }

      const discountTotal = calculatedDiscounts.reduce(
        (sum, d) => sum + d.amount,
        0
      );
      const total = subtotal + taxTotal - discountTotal;

      updateFields.subtotal = subtotal;
      updateFields.taxTotal = taxTotal;
      updateFields.discountTotal = discountTotal;
      updateFields.total = total;

      // Insert new line items
      if (calculatedLineItems.length > 0) {
        await db.insert(invoiceLineItems).values(calculatedLineItems);
      }

      // Insert new discounts
      if (calculatedDiscounts.length > 0) {
        await db.insert(invoiceDiscounts).values(calculatedDiscounts);
      }

      // Link time entries
      const timeEntryIds = calculatedLineItems
        .map((item) => item.timeEntryId)
        .filter((id): id is string => id !== null);

      for (const timeEntryId of timeEntryIds) {
        await db
          .update(timeEntries)
          .set({ invoiceId })
          .where(
            and(
              eq(timeEntries.id, timeEntryId),
              eq(timeEntries.userId, user.id)
            )
          );
      }
    } else if (data.discounts) {
      // Discounts updated without line items - recalculate discount totals only
      await db
        .delete(invoiceDiscounts)
        .where(eq(invoiceDiscounts.invoiceId, invoiceId));

      const calculatedDiscounts = data.discounts.map((discount) => {
        const amount =
          discount.type === "percentage"
            ? Math.round((existing.subtotal * discount.value) / 100)
            : Math.round(discount.value);
        return {
          invoiceId,
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

      updateFields.discountTotal = discountTotal;
      updateFields.total = existing.subtotal + existing.taxTotal - discountTotal;

      if (calculatedDiscounts.length > 0) {
        await db.insert(invoiceDiscounts).values(calculatedDiscounts);
      }
    }

    // Update the invoice record
    await db
      .update(invoices)
      .set(updateFields)
      .where(eq(invoices.id, invoiceId));

    // Return updated invoice with relations
    const updated = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: { client: true, lineItems: true, discounts: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    const { invoiceId } = await params;

    // Verify ownership
    const existing = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Clear invoiceId from linked time entries
    await db
      .update(timeEntries)
      .set({ invoiceId: null })
      .where(eq(timeEntries.invoiceId, invoiceId));

    // Delete line items
    await db
      .delete(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));

    // Delete discounts
    await db
      .delete(invoiceDiscounts)
      .where(eq(invoiceDiscounts.invoiceId, invoiceId));

    // Delete the invoice
    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
