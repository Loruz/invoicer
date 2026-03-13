import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { clients } from "./clients";

export const projects = pgTable("projects", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  clientId: uuid("client_id")
    .references(() => clients.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  hourlyRate: integer("hourly_rate"),
  currency: text("currency").default("USD").notNull(),
  color: text("color"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
