import { useQuery } from "@tanstack/react-query";
import type { TimeEntryWithProject } from "@invoicer/shared";

export function useActiveTimer() {
  return useQuery<TimeEntryWithProject | null>({
    queryKey: ["timer", "active"],
    queryFn: async () => {
      const res = await fetch("/api/timer/active");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30_000,
  });
}
