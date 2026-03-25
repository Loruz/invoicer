import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateUserSettingsSchema } from "@invoicer/shared";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      businessName: user.businessName,
      businessAddress: user.businessAddress,
      businessEmail: user.businessEmail,
      businessPhone: user.businessPhone,
      businessEntity: user.businessEntity,
      taxId: user.taxId,
      defaultCurrency: user.defaultCurrency,
      invoiceTemplate: user.invoiceTemplate,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const body = await req.json();
    const data = updateUserSettingsSchema.parse(body);

    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      businessName: updated.businessName,
      businessAddress: updated.businessAddress,
      businessEmail: updated.businessEmail,
      businessPhone: updated.businessPhone,
      taxId: updated.taxId,
      defaultCurrency: updated.defaultCurrency,
      invoiceTemplate: updated.invoiceTemplate,
    });
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
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
