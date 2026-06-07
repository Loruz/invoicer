import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getNextInvoiceNumber } from "@/lib/invoice-number";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const basedOn = new URL(req.url).searchParams.get("basedOn");
    const invoiceNumber = await getNextInvoiceNumber(user.id, basedOn);

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
