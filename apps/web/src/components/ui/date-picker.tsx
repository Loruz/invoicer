"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-[#E8ECF1] bg-white px-3 py-2.5 text-sm text-left outline-none transition-colors hover:bg-slate-50 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          value && "text-slate-900",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
        {value ? format(value, "PPP") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
