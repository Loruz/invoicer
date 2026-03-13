import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { clients } from "./clients";

export const invoices = pgTable("invoices", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  status: text("status").default("draft").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  currency: text("currency").default("USD").notNull(),
  subtotal: integer("subtotal").default(0).notNull(),
  taxTotal: integer("tax_total").default(0).notNull(),
  discountTotal: integer("discount_total").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  notes: text("notes"),
  paymentTerms: text("payment_terms"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
