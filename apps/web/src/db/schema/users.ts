import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
  taxId: text("tax_id"),
  defaultCurrency: text("default_currency").default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
