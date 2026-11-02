"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface StatementFieldProps {
  id: string;
  required?: boolean;
  /** Statement with variables already resolved. */
  text: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
}

export function StatementField({
  id,
  required,
  text,
  checked,
  onCheckedChange,
  disabled = false,
  error = false,
}: StatementFieldProps) {
  const readOnly = disabled || !onCheckedChange;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        error && "border-destructive"
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={readOnly}
        onCheckedChange={(value) => onCheckedChange?.(value === true)}
        className="mt-0.5"
      />
      <label
        htmlFor={id}
        className={cn(
          "text-sm leading-relaxed whitespace-pre-wrap",
          readOnly ? "cursor-default" : "cursor-pointer"
        )}
      >
        {text}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    </div>
  );
}
