"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";
import { formatCurrency } from "@invoicer/shared";
import type { InvoiceStatus, Client } from "@invoicer/shared";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  total: number;
  client: Client;
}

interface InvoiceListProps {
  invoices: InvoiceWithClient[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "sent":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Sent
        </Badge>
      );
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Paid
        </Badge>
      );
    case "overdue":
      return <Badge variant="destructive">Overdue</Badge>;
    case "cancelled":
      return <Badge variant="outline">Cancelled</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredInvoices =
    activeTab === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeTab);

  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({counts.draft})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({counts.sent})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({counts.paid})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({counts.overdue})</TabsTrigger>
        </TabsList>

        {["all", "draft", "sent", "paid", "overdue"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filteredInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-3 h-10 w-10 opacity-50" />
                  <p>No invoices found.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.client.companyName}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
