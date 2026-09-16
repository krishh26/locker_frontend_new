"use client";

import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Shared "Unit / Title" hierarchy chrome. Gap Analysis and the evidence detail
 * view both drill down Unit -> (Learning Outcome | Module type) -> criteria, so
 * they render the same header bar and accordion rows.
 */
export function UnitHierarchyHeader({
  unitLabel,
  titleLabel,
}: {
  unitLabel: string;
  titleLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-muted-foreground">
      <span className="size-5 shrink-0" aria-hidden />
      <span className="w-20 shrink-0 sm:w-28">{unitLabel}</span>
      <span className="min-w-0 max-w-3xl flex-1">{titleLabel}</span>
    </div>
  );
}

export function UnitAccordionItem({
  value,
  unitLabel,
  titleLabel,
  nested = false,
  children,
}: {
  value: string;
  unitLabel: string;
  titleLabel: string;
  nested?: boolean;
  children: ReactNode;
}) {
  const fullTitle = [unitLabel, titleLabel].filter(Boolean).join(" - ");
  return (
    <AccordionItem
      value={value}
      className={`min-w-0 overflow-hidden rounded-md border border-border last:border-b ${
        nested ? "bg-muted/20" : "bg-card"
      }`}
    >
      <AccordionTrigger
        className={`cursor-pointer items-center overflow-hidden px-4 text-left hover:no-underline data-[state=open]:[&_.unit-accordion-plus]:hidden data-[state=closed]:[&_.unit-accordion-minus]:hidden [&>svg]:hidden ${
          nested
            ? "bg-muted/20 py-3 font-medium hover:bg-muted/20"
            : "bg-card py-4 font-semibold hover:bg-card"
        }`}
      >
        <span className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
          <span className="relative flex size-5 shrink-0 items-center justify-center text-muted-foreground">
            <Plus className="unit-accordion-plus size-4" />
            <Minus className="unit-accordion-minus absolute size-4" />
          </span>
          <span className="w-20 shrink-0 truncate sm:w-28" title={unitLabel}>
            {unitLabel}
          </span>
          <span
            className="line-clamp-3 min-w-0 max-w-3xl flex-1 whitespace-normal wrap-break-word"
            title={titleLabel || fullTitle}
          >
            {titleLabel}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="border-t bg-card px-4 pb-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
