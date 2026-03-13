"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency } from "@invoicer/shared";
import type { Client } from "@invoicer/shared";

interface LineItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: number;
  amount: number;
  taxRate: string | number;
  taxAmount: number;
}

interface InvoiceDiscount {
  id: string;
  description: string;
  type: string;
  value: string | number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  client: Client;
  lineItems: LineItem[];
  discounts: InvoiceDiscount[];
}

interface User {
  name: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  taxId: string | null;
  email: string;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  user: User;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function InvoicePreview({ invoice, user }: InvoicePreviewProps) {
  return (
    <Card>
      <CardContent className="p-8">
        {/* Header: Business Info & Invoice Info */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-bold">
              {user.businessName || user.name || "Your Business"}
            </h2>
            {user.businessAddress && (
              <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">
                {user.businessAddress}
              </p>
            )}
            {(user.businessEmail || user.email) && (
              <p className="text-sm text-muted-foreground mt-1">
                {user.businessEmail || user.email}
              </p>
            )}
            {user.businessPhone && (
              <p className="text-sm text-muted-foreground">
                {user.businessPhone}
              </p>
            )}
            {user.taxId && (
              <p className="text-sm text-muted-foreground">
                Tax ID: {user.taxId}
              </p>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-3xl font-bold text-muted-foreground">
              INVOICE
            </h1>
            <p className="text-lg font-medium mt-1">
              {invoice.invoiceNumber}
            </p>
            <div className="mt-2 text-sm space-y-0.5">
              <p>
                <span className="text-muted-foreground">Issue Date: </span>
                {formatDate(invoice.issueDate)}
              </p>
              {invoice.dueDate && (
                <p>
                  <span className="text-muted-foreground">Due Date: </span>
                  {formatDate(invoice.dueDate)}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Bill To */}
        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Bill To
          </p>
          <h3 className="text-lg font-semibold">
            {invoice.client.companyName}
          </h3>
          {invoice.client.contactName && (
            <p className="text-sm">{invoice.client.contactName}</p>
          )}
          {invoice.client.address && (
            <p className="text-sm text-muted-foreground">
              {invoice.client.address}
            </p>
          )}
          {(invoice.client.city ||
            invoice.client.postalCode ||
            invoice.client.country) && (
            <p className="text-sm text-muted-foreground">
              {[
                invoice.client.city,
                invoice.client.postalCode,
                invoice.client.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {invoice.client.email && (
            <p className="text-sm text-muted-foreground">
              {invoice.client.email}
            </p>
          )}
          {invoice.client.taxId && (
            <p className="text-sm text-muted-foreground">
              Tax ID: {invoice.client.taxId}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lineItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">
                  {Number(item.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {Number(item.taxRate) > 0
                    ? `${Number(item.taxRate)}%`
                    : "-"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.amount, invoice.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>
                  {formatCurrency(invoice.taxTotal, invoice.currency)}
                </span>
              </div>
            )}
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-red-600">
                  -{formatCurrency(invoice.discountTotal, invoice.currency)}
                </span>
              </div>
            )}
            {invoice.discounts.length > 0 &&
              invoice.discounts.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between text-sm pl-4"
                >
                  <span className="text-muted-foreground text-xs">
                    {d.description} (
                    {d.type === "percentage"
                      ? `${Number(d.value)}%`
                      : formatCurrency(
                          Math.round(Number(d.value) * 100),
                          invoice.currency
                        )}
                    )
                  </span>
                  <span className="text-xs text-red-600">
                    -{formatCurrency(d.amount, invoice.currency)}
                  </span>
                </div>
              ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Payment Terms */}
        {(invoice.notes || invoice.paymentTerms) && (
          <div className="mt-8 pt-6 border-t space-y-4">
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div>
                <p className="text-sm font-medium mb-1">Payment Terms</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {invoice.paymentTerms}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
