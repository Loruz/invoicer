"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      position="top-center"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-500" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-slate-500" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success: "[&_[data-icon]]:text-emerald-500 border-emerald-200 bg-emerald-50 text-emerald-900",
          error: "[&_[data-icon]]:text-red-500 border-red-200 bg-red-50 text-red-900",
          warning: "[&_[data-icon]]:text-amber-500 border-amber-200 bg-amber-50 text-amber-900",
          info: "[&_[data-icon]]:text-blue-500 border-blue-200 bg-blue-50 text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
