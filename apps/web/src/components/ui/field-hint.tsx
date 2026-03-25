"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FieldHintProps {
  message: string
  ctaLabel: string
  ctaHref: string
  children: React.ReactNode
}

export function FieldHint({ message, ctaLabel, ctaHref, children }: FieldHintProps) {
  return (
    <Popover>
      <PopoverTrigger className="w-full cursor-default">
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-slate-700">{message}</p>
            <Link
              href={ctaHref}
              className="mt-2 inline-flex items-center rounded-md bg-[#0F3D5F] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0C3350] transition-colors"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
