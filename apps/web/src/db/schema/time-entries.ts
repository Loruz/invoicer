import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { projects } from "./projects";
import { invoices } from "./invoices";

export const timeEntries = pgTable("time_entries", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  duration: integer("duration"),
  billable: boolean("billable").default(true).notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
