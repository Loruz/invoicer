import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const clients = pgTable("clients", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  postalCode: text("postal_code"),
  taxId: text("tax_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
