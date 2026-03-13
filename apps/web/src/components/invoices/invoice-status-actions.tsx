"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Send, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { InvoiceStatus } from "@invoicer/shared";

interface InvoiceStatusActionsProps {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}

export function InvoiceStatusActions({
  invoiceId,
  currentStatus,
}: InvoiceStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: InvoiceStatus) => {
    setLoading(newStatus);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update status");
      }

      toast.success(`Invoice marked as ${newStatus}.`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setLoading(null);
    }
  };

  const deleteInvoice = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    setLoading("delete");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to delete invoice");
      }

      toast.success("Invoice deleted.");
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete invoice."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "draft" && (
        <Button
          variant="default"
          size="sm"
          onClick={() => updateStatus("sent")}
          disabled={loading !== null}
        >
          {loading === "sent" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-1 h-4 w-4" />
          )}
          Mark as Sent
        </Button>
      )}

      {currentStatus === "sent" && (
        <Button
          variant="default"
          size="sm"
          onClick={() => updateStatus("paid")}
          disabled={loading !== null}
        >
          {loading === "paid" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-1 h-4 w-4" />
          )}
          Mark as Paid
        </Button>
      )}

      {currentStatus === "sent" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus("overdue")}
          disabled={loading !== null}
        >
          {loading === "overdue" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-4 w-4" />
          )}
          Mark as Overdue
        </Button>
      )}

      {(currentStatus === "draft" ||
        currentStatus === "sent" ||
        currentStatus === "overdue") && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateStatus("cancelled")}
          disabled={loading !== null}
        >
          {loading === "cancelled" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-4 w-4" />
          )}
          Cancel
        </Button>
      )}

      {currentStatus === "draft" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={deleteInvoice}
          disabled={loading !== null}
          className="text-destructive hover:text-destructive"
        >
          {loading === "delete" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-1 h-4 w-4" />
          )}
          Delete
        </Button>
      )}
    </div>
  );
}
