import type { CurrencyCode, InvoiceStatus, DiscountType } from "../constants";

export type InvoiceTemplate = {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  fontFamily: "default" | "serif" | "mono";
  layout: "classic" | "modern" | "minimal" | "formal";
  showLogo: boolean;
  showTaxId: boolean;
  showPaymentTerms: boolean;
  showNotes: boolean;
  footerText: string | null;
};

export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplate = {
  logoUrl: null,
  primaryColor: "#2563eb",
  accentColor: "#0F766E",
  fontFamily: "default",
  layout: "classic",
  showLogo: true,
  showTaxId: true,
  showPaymentTerms: true,
  showNotes: true,
  footerText: null,
};

export type User = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessEntity: string | null;
  taxId: string | null;
  defaultCurrency: string;
  invoiceTemplate: InvoiceTemplate | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Client = {
  id: string;
  userId: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  taxId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Project = {
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description: string | null;
  hourlyRate: number | null;
  currency: string;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectWithClient = Project & {
  client: Client;
};

export type TimeEntry = {
  id: string;
  userId: string;
  projectId: string;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  billable: boolean;
  invoiceId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TimeEntryWithProject = TimeEntry & {
  project: ProjectWithClient;
};

export type Invoice = {
  id: string;
  userId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceLineItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  timeEntryId: string | null;
  sortOrder: number;
};

export type InvoiceDiscount = {
  id: string;
  invoiceId: string;
  description: string;
  type: DiscountType;
  value: number;
  amount: number;
};

export type InvoiceWithDetails = Invoice & {
  client: Client;
  lineItems: InvoiceLineItem[];
  discounts: InvoiceDiscount[];
};
