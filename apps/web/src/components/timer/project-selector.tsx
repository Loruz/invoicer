"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectWithClient } from "@invoicer/shared";

interface ProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ProjectSelector({
  value,
  onChange,
  className,
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const activeProjects = projects.filter((p) => p.isActive);

  return (
    <Select value={value} onValueChange={(val) => val !== null && onChange(val)}>
      <SelectTrigger className={className} disabled={loading}>
        <SelectValue placeholder={loading ? "Loading..." : "Select project"} />
      </SelectTrigger>
      <SelectContent>
        {activeProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
        {activeProjects.length === 0 && !loading && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No projects found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
