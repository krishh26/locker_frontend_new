import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  autoComplete,
  ...props
}: React.ComponentProps<"input">) {
  // Prevent browser/password-manager autofill from reusing saved values.
  // - For passwords, use "new-password" to avoid filling "current-password".
  // - For everything else, disable autocomplete suggestions.
  const resolvedAutoComplete =
    autoComplete ?? (type === "password" ? "new-password" : "off")

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm",
        // clearer disabled state globally
        "disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:opacity-100",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      autoComplete={resolvedAutoComplete}
      {...props}
    />
  )
}

export { Input }
