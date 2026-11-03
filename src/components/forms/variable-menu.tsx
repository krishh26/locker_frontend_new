"use client";

import { Braces } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TEMPLATE_VARIABLES, useVariableLabel, variableToken } from "./template-variables";

interface VariableMenuProps {
  onInsert: (token: string) => void;
  disabled?: boolean;
  /** Icon-only trigger for toolbars. */
  compact?: boolean;
}

export function VariableMenu({ onInsert, disabled, compact = false }: VariableMenuProps) {
  const t = useTranslations("forms.variables");
  const variableLabel = useVariableLabel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={compact ? "ghost" : "outline"}
          disabled={disabled}
          title={t("insert")}
          aria-label={t("insert")}
          className={compact ? "h-8 w-8 p-0" : "h-8"}
        >
          <Braces className="h-4 w-4" />
          {!compact && <span className="ml-1">{t("insert")}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {TEMPLATE_VARIABLES.map((variable) => (
          <DropdownMenuItem key={variable.key} onSelect={() => onInsert(variableToken(variable.key))}>
            <span className="flex-1">{variableLabel(variable.key)}</span>
            <code className="ml-4 text-xs text-muted-foreground">{variableToken(variable.key)}</code>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
