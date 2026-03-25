"use client";

import { useState, useEffect } from "react";
import { ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldHint } from "@/components/ui/field-hint";
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

  if (!loading && activeProjects.length === 0) {
    return (
      <FieldHint
        message="Create a project first to track time."
        ctaLabel="New Project"
        ctaHref="/projects/new"
      >
        <div className="flex w-full items-center justify-between rounded-lg border border-[#E8ECF1] bg-slate-50 px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed opacity-60">
          <span>No projects found</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </div>
      </FieldHint>
    );
  }

  return (
    <Select value={value || null} onValueChange={(val) => { if (val !== null) onChange(val); }}>
      <SelectTrigger className={className} disabled={loading}>
        <SelectValue placeholder={loading ? "Loading..." : "Select project"} />
      </SelectTrigger>
      <SelectContent>
        {activeProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
