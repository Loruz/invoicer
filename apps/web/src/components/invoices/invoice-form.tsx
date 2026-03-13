"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  currencies,
  formatCurrency,
  type Client,
  type DiscountType,
} from "@invoicer/shared";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  taxRate: number;
  timeEntryId?: string;
  sortOrder: number;
}

interface Discount {
  description: string;
  type: DiscountType;
  value: number;
}

interface InvoiceInitialData {
  clientId: string;
  currency: string;
  issueDate: Date;
  dueDate: Date | null;
  notes: string | null;
  paymentTerms: string | null;
  lineItems: Array<{
    description: string;
    quantity: string | number;
    unitPrice: number;
    taxRate: string | number;
    timeEntryId: string | null;
    sortOrder: number;
  }>;
  discounts: Array<{
    description: string;
    type: string;
    value: string | number;
    amount: number;
  }>;
}

interface InvoiceFormProps {
  initialData?: InvoiceInitialData;
  invoiceId?: string;
  defaultClientId?: string;
}

function toDateInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function calculateLineAmount(item: LineItem): number {
  return Math.round(item.quantity * item.unitPrice);
}

function calculateLineTax(item: LineItem): number {
  const amount = calculateLineAmount(item);
  return Math.round(amount * (item.taxRate / 100));
}

export function InvoiceForm({
  initialData,
  invoiceId,
  defaultClientId,
}: InvoiceFormProps) {
  const router = useRouter();
  const isEditing = !!invoiceId;

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importingTime, setImportingTime] = useState(false);

  // Form state
  const [clientId, setClientId] = useState(
    initialData?.clientId ?? defaultClientId ?? ""
  );
  const [currency, setCurrency] = useState(
    initialData?.currency ?? "USD"
  );
  const [issueDate, setIssueDate] = useState(
    toDateInputValue(initialData?.issueDate ?? new Date())
  );
  const [dueDate, setDueDate] = useState(
    toDateInputValue(initialData?.dueDate ?? null)
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [paymentTerms, setPaymentTerms] = useState(
    initialData?.paymentTerms ?? ""
  );

  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (initialData?.lineItems && initialData.lineItems.length > 0) {
      return initialData.lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: li.unitPrice,
        taxRate: Number(li.taxRate),
        timeEntryId: li.timeEntryId ?? undefined,
        sortOrder: li.sortOrder,
      }));
    }
    return [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        sortOrder: 0,
      },
    ];
  });

  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    if (initialData?.discounts && initialData.discounts.length > 0) {
      return initialData.discounts.map((d) => ({
        description: d.description,
        type: d.type as DiscountType,
        value: Number(d.value),
      }));
    }
    return [];
  });

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + calculateLineAmount(item),
    0
  );
  const taxTotal = lineItems.reduce(
    (sum, item) => sum + calculateLineTax(item),
    0
  );
  const discountTotal = discounts.reduce((sum, d) => {
    if (d.type === "percentage") {
      return sum + Math.round(subtotal * (d.value / 100));
    }
    return sum + Math.round(d.value * 100);
  }, 0);
  const total = subtotal + taxTotal - discountTotal;

  // Line item management
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        sortOrder: prev.length,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Discount management
  const addDiscount = () => {
    setDiscounts((prev) => [
      ...prev,
      { description: "", type: "percentage" as DiscountType, value: 0 },
    ]);
  };

  const removeDiscount = (index: number) => {
    setDiscounts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDiscount = (
    index: number,
    field: keyof Discount,
    value: string | number
  ) => {
    setDiscounts((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Import unbilled time entries
  const importUnbilledTime = useCallback(async () => {
    if (!clientId) {
      toast.error("Please select a client first.");
      return;
    }

    setImportingTime(true);
    try {
      const res = await fetch(
        `/api/time-entries?clientId=${clientId}&unbilled=true`
      );
      if (!res.ok) throw new Error("Failed to fetch time entries");

      const entries = await res.json();
      if (!entries || entries.length === 0) {
        toast.info("No unbilled time entries found for this client.");
        return;
      }

      const newItems: LineItem[] = entries.map(
        (
          entry: {
            id: string;
            description: string | null;
            duration: number | null;
            project?: {
              name: string;
              hourlyRate: number | null;
            };
          },
          idx: number
        ) => {
          const hours = entry.duration ? entry.duration / 3600 : 0;
          const hourlyRate = entry.project?.hourlyRate ?? 0;
          const desc = entry.description
            ? `${entry.project?.name ?? "Project"} - ${entry.description}`
            : entry.project?.name ?? "Time entry";

          return {
            description: desc,
            quantity: Math.round(hours * 100) / 100,
            unitPrice: hourlyRate,
            taxRate: 0,
            timeEntryId: entry.id,
            sortOrder: lineItems.length + idx,
          };
        }
      );

      setLineItems((prev) => {
        // Remove the initial empty line item if it exists
        const existing =
          prev.length === 1 &&
          prev[0].description === "" &&
          prev[0].unitPrice === 0
            ? []
            : prev;
        return [...existing, ...newItems];
      });

      toast.success(`Imported ${newItems.length} time entries.`);
    } catch {
      toast.error("Failed to import time entries.");
    } finally {
      setImportingTime(false);
    }
  }, [clientId, lineItems.length]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }

    if (lineItems.some((li) => !li.description)) {
      toast.error("All line items must have a description.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId,
        currency,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined,
        paymentTerms: paymentTerms || undefined,
        lineItems: lineItems.map((li, idx) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          taxRate: li.taxRate,
          timeEntryId: li.timeEntryId,
          sortOrder: idx,
        })),
        discounts:
          discounts.length > 0
            ? discounts.map((d) => ({
                description: d.description,
                type: d.type,
                value: d.value,
              }))
            : undefined,
      };

      const url = isEditing
        ? `/api/invoices/${invoiceId}`
        : "/api/invoices";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to save invoice");
      }

      const data = await res.json();
      toast.success(
        isEditing ? "Invoice updated." : "Invoice created."
      );
      router.push(`/invoices/${data.id ?? invoiceId}`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save invoice."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client & Currency */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                value={clientId}
                onValueChange={(val) => val !== null && setClientId(val)}
              >
                <SelectTrigger
                  className="w-full"
                  disabled={loadingClients}
                >
                  <SelectValue
                    placeholder={
                      loadingClients ? "Loading clients..." : "Select a client"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(val) => val !== null && setCurrency(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code} - {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={importUnbilledTime}
                disabled={!clientId || importingTime}
              >
                {importingTime ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-1 h-4 w-4" />
                )}
                Import Unbilled Time
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Description</TableHead>
                <TableHead className="w-[12%]">Qty</TableHead>
                <TableHead className="w-[15%]">Unit Price</TableHead>
                <TableHead className="w-[12%]">Tax %</TableHead>
                <TableHead className="w-[15%] text-right">Amount</TableHead>
                <TableHead className="w-[6%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => {
                const amount = calculateLineAmount(item);
                const tax = calculateLineTax(item);
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.unitPrice / 100}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "unitPrice",
                            Math.round(
                              (parseFloat(e.target.value) || 0) * 100
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "taxRate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(amount + tax, currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(subtotal, currency)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Tax
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(taxTotal, currency)}
                </TableCell>
                <TableCell />
              </TableRow>
              {discountTotal > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Discount
                  </TableCell>
                  <TableCell className="text-right font-medium text-red-600">
                    -{formatCurrency(discountTotal, currency)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={4} className="text-right text-lg font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right text-lg font-bold">
                  {formatCurrency(total, currency)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Discounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Discounts</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDiscount}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Discount
            </Button>
          </div>
        </CardHeader>
        {discounts.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {discounts.map((discount, index) => (
                <div
                  key={index}
                  className="flex items-end gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={discount.description}
                      onChange={(e) =>
                        updateDiscount(index, "description", e.target.value)
                      }
                      placeholder="Discount description"
                      required
                    />
                  </div>
                  <div className="w-40 space-y-1">
                    <Label>Type</Label>
                    <Select
                      value={discount.type}
                      onValueChange={(val: string | null) => {
                        if (val !== null) updateDiscount(index, "type", val);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-1">
                    <Label>
                      {discount.type === "percentage" ? "%" : "Amount"}
                    </Label>
                    <Input
                      type="number"
                      step={discount.type === "percentage" ? "0.01" : "0.01"}
                      min="0"
                      value={discount.value}
                      onChange={(e) =>
                        updateDiscount(
                          index,
                          "value",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiscount(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notes & Payment Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes to display on the invoice..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Textarea
              id="paymentTerms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Payment terms and conditions..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}
