import { useQuery } from "@tanstack/react-query";

export function useNextInvoiceNumber(enabled: boolean) {
  return useQuery<string>({
    queryKey: ["invoices", "next-number"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/next-number");
      if (!res.ok) return "";
      const data = await res.json();
      return data?.invoiceNumber ?? "";
    },
    enabled,
  });
}
