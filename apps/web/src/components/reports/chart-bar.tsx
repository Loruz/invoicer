"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ChartBar({
  height,
  className,
  label,
}: {
  height: string;
  className: string;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className={cn("w-8 rounded-t-md", className)}
            style={{ height, marginTop: "auto" }}
          />
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
