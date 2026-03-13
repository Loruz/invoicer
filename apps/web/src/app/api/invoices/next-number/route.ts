import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const year = new Date().getFullYear();
    const existing = await db.query.invoices.findMany({
      where: eq(invoices.userId, user.id),
      columns: { invoiceNumber: true },
    });

    const yearInvoices = existing.filter((i) =>
      i.invoiceNumber.startsWith(`INV-${year}-`)
    );
    const nextNum = yearInvoices.length + 1;
    const invoiceNumber = `INV-${year}-${nextNum.toString().padStart(4, "0")}`;

    return NextResponse.json({ invoiceNumber });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate invoice number" },
      { status: 500 }
    );
  }
}
