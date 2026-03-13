import { pgTable, uuid, text, integer, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { invoices } from "./invoices";

export const invoiceDiscounts = pgTable("invoice_discounts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  value: numeric("value").notNull(),
  amount: integer("amount").notNull(),
});
