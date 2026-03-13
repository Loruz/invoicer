import { pgTable, uuid, text, integer, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { invoices } from "./invoices";
import { timeEntries } from "./time-entries";

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  description: text("description").notNull(),
  quantity: numeric("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  amount: integer("amount").notNull(),
  taxRate: numeric("tax_rate").default("0").notNull(),
  taxAmount: integer("tax_amount").default(0).notNull(),
  timeEntryId: uuid("time_entry_id").references(() => timeEntries.id),
  sortOrder: integer("sort_order").default(0).notNull(),
});
