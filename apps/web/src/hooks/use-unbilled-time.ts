import { useQuery } from "@tanstack/react-query";

export function useUnbilledTime(clientId: string | null) {
  return useQuery<number>({
    queryKey: ["time-entries", "unbilled", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/time-entries?clientId=${clientId}&unbilled=true`);
      if (!res.ok) return 0;
      const entries: { duration: number | null }[] = await res.json();
      return entries.reduce((s, e) => s + (e.duration ?? 0), 0);
    },
    enabled: !!clientId,
  });
}
