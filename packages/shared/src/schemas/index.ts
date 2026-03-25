import { z } from "zod";
import { currencies, invoiceStatuses, discountTypes } from "../constants";

const currencyCodes = currencies.map((c) => c.code) as [string, ...string[]];

// Client schemas
export const createClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(255),
  companyCode: z.string().max(50).optional(),
  contactName: z.string().max(255).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  taxId: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Project schemas
export const createProjectSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(2000).optional(),
  hourlyRate: z.number().int().min(0).optional(),
  currency: z.enum(currencyCodes).default("USD"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateProjectSchema = createProjectSchema.partial();

// Timer schemas
export const startTimerSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  description: z.string().max(500).optional(),
  billable: z.boolean().default(true),
});

export const stopTimerSchema = z.object({
  entryId: z.string().uuid("Invalid entry ID"),
});

// Time entry schemas
export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  description: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  billable: z.boolean().default(true),
});

export const updateTimeEntrySchema = z.object({
  projectId: z.string().uuid("Invalid project ID").optional(),
  description: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  billable: z.boolean().optional(),
});

// Invoice line item schema
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().int("Unit price must be in cents"),
  taxRate: z.number().min(0).max(100).default(0),
  timeEntryId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// Invoice discount schema
export const invoiceDiscountSchema = z.object({
  description: z.string().min(1).max(255),
  type: z.enum(discountTypes),
  value: z.number().positive("Discount value must be positive"),
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  currency: z.enum(currencyCodes).default("USD"),
  notes: z.string().max(2000).optional(),
  paymentTerms: z.string().max(1000).optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1, "At least one line item"),
  discounts: z.array(invoiceDiscountSchema).optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(invoiceStatuses).optional(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  paymentTerms: z.string().max(1000).optional(),
  lineItems: z.array(invoiceLineItemSchema).optional(),
  discounts: z.array(invoiceDiscountSchema).optional(),
});

// Invoice template schema
export const invoiceTemplateSchema = z.object({
  logoUrl: z.string().max(500).nullable().default(null),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#2563eb"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0F766E"),
  fontFamily: z.enum(["default", "serif", "mono"]).default("default"),
  layout: z.enum(["classic", "modern", "minimal", "formal"]).default("classic"),
  showLogo: z.boolean().default(true),
  showTaxId: z.boolean().default(true),
  showPaymentTerms: z.boolean().default(true),
  showNotes: z.boolean().default(true),
  footerText: z.string().max(500).nullable().default(null),
});

// User settings schema
export const updateUserSettingsSchema = z.object({
  name: z.string().max(255).optional(),
  businessName: z.string().max(255).optional(),
  businessAddress: z.string().max(500).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  businessPhone: z.string().max(50).optional(),
  businessEntity: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  defaultCurrency: z.enum(currencyCodes).optional(),
  invoiceTemplate: invoiceTemplateSchema.optional(),
});

// Infer types from schemas
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type StopTimerInput = z.infer<typeof stopTimerSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceDiscountInput = z.infer<typeof invoiceDiscountSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type InvoiceTemplateInput = z.infer<typeof invoiceTemplateSchema>;
