import { useQuery } from "@tanstack/react-query";
import type { Client } from "@invoicer/shared";

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) return [];
      return res.json();
    },
  });
}
