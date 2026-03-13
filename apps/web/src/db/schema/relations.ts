import { relations } from "drizzle-orm";
import { users } from "./users";
import { clients } from "./clients";
import { projects } from "./projects";
import { timeEntries } from "./time-entries";
import { invoices } from "./invoices";
import { invoiceLineItems } from "./invoice-line-items";
import { invoiceDiscounts } from "./invoice-discounts";

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  timeEntries: many(timeEntries),
  invoices: many(invoices),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
  invoices: many(invoices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  timeEntries: many(timeEntries),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  invoice: one(invoices, {
    fields: [timeEntries.invoiceId],
    references: [invoices.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  lineItems: many(invoiceLineItems),
  discounts: many(invoiceDiscounts),
  timeEntries: many(timeEntries),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
    timeEntry: one(timeEntries, {
      fields: [invoiceLineItems.timeEntryId],
      references: [timeEntries.id],
    }),
  })
);

export const invoiceDiscountsRelations = relations(
  invoiceDiscounts,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceDiscounts.invoiceId],
      references: [invoices.id],
    }),
  })
);
