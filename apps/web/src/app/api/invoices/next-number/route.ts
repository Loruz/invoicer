import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const [result] = await db
      .select({
        maxNum: sql<string>`MAX(CAST(SUBSTRING(${invoices.invoiceNumber} FROM ${prefix.length + 1}) AS INTEGER))`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, user.id),
          sql`${invoices.invoiceNumber} LIKE ${prefix + '%'}`
        )
      );

    const nextNum = (parseInt(result?.maxNum || "0", 10) || 0) + 1;
    const invoiceNumber = `${prefix}${nextNum.toString().padStart(4, "0")}`;

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
