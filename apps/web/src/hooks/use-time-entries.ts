import { useQuery } from "@tanstack/react-query";
import type { TimeEntryWithProject } from "@invoicer/shared";

interface UseTimeEntriesOptions {
  from: string;
  to?: string;
}

export function useTimeEntries({ from, to }: UseTimeEntriesOptions) {
  return useQuery<TimeEntryWithProject[]>({
    queryKey: ["time-entries", from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ from });
      if (to) params.set("to", to);
      const res = await fetch(`/api/time-entries?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}
