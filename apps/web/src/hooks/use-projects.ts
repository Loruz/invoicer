import { useQuery } from "@tanstack/react-query";
import type { ProjectWithClient } from "@invoicer/shared";

export function useProjects() {
  return useQuery<ProjectWithClient[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useActiveProjects() {
  const query = useProjects();
  return {
    ...query,
    data: query.data?.filter((p) => p.isActive) ?? [],
  };
}
