import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { InvoiceTemplate } from "@invoicer/shared";

export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").notNull(),
  name: text("name"),
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessEntity: text("business_entity"),
  taxId: text("tax_id"),
  companyCode: text("company_code"),
  bankName: text("bank_name"),
  bankCode: text("bank_code"),
  bankSwift: text("bank_swift"),
  bankAccount: text("bank_account"),
  defaultCurrency: text("default_currency").default("USD").notNull(),
  invoiceTemplate: jsonb("invoice_template").$type<InvoiceTemplate | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
