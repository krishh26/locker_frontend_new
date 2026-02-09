"use client"

import { useTheme } from "@/hooks/use-theme"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  // Resolve the actual mode for Sonner
  const resolvedTheme = (() => {
    if (theme === "dark") return "dark"
    if (theme === "light") return "light"
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  })()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--popover-foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--destructive)",
          "--error-border": "var(--destructive)",
          "--warning-bg": "var(--popover)",
          "--warning-text": "var(--popover-foreground)",
          "--warning-border": "var(--border)",
          "--info-bg": "var(--popover)",
          "--info-text": "var(--popover-foreground)",
          "--info-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!bg-[var(--popover)] !text-[var(--popover-foreground)] !border-[var(--border)]",
          title: "!text-[var(--popover-foreground)]",
          description: "!text-[var(--muted-foreground)]",
          success: "!bg-[var(--popover)] !text-[var(--popover-foreground)] !border-[var(--border)]",
          error: "!bg-[var(--popover)] !text-[var(--destructive)] !border-[var(--destructive)]",
          warning: "!bg-[var(--popover)] !text-[var(--popover-foreground)] !border-[var(--border)]",
          info: "!bg-[var(--popover)] !text-[var(--popover-foreground)] !border-[var(--border)]",
          actionButton: "!bg-[var(--primary)] !text-[var(--primary-foreground)]",
          cancelButton: "!bg-[var(--muted)] !text-[var(--muted-foreground)]",
          closeButton: "!bg-[var(--popover)] !text-[var(--popover-foreground)] !border-[var(--border)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
