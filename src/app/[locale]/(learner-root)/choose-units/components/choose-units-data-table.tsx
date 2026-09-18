"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion } from "@/components/ui/accordion";
import {
  UnitAccordionItem,
  UnitHierarchyHeader,
} from "@/components/unit-hierarchy-accordion";
import type { SubUnit, Unit } from "@/store/api/units/types";
import {
  buildStandardCriteriaCodes,
  getLearningOutcomeParts,
  getQualificationUnitParts,
  getStandardUnitParts,
} from "@/utils/unit-labels";

type FormValues = {
  selectedUnitIds: string[];
};

type CriteriaRow = {
  id: string;
  code: string;
  title: string;
};

type LearningOutcomeSection = {
  id: string;
  unitLabel: string;
  titleLabel: string;
  rows: CriteriaRow[];
};

type UnitSection = {
  unit: Unit;
  id: string;
  unitLabel: string;
  titleLabel: string;
  rows: CriteriaRow[];
  children?: LearningOutcomeSection[];
};

interface ChooseUnitsDataTableProps {
  units: Unit[];
  mandatoryUnitIds: string[];
  isStandardCourse?: boolean;
}

function getTypeColor(mandatory: boolean) {
  return mandatory
    ? "text-white bg-primary"
    : "text-muted-foreground bg-muted";
}

function collectQualificationCriteria(
  sub: SubUnit,
  subIndex: number,
): CriteriaRow[] {
  const loOrder =
    Number(sub.showOrder) > 0 ? Number(sub.showOrder) : subIndex + 1;
  const topics = Array.isArray(sub.topics) ? sub.topics : [];

  if (topics.length > 0) {
    return topics.map((topic, topicIndex) => {
      const topicOrder =
        Number(topic.showOrder) > 0 ? Number(topic.showOrder) : topicIndex + 1;
      const code = String(topic.code ?? "").trim() || `${loOrder}.${topicOrder}`;
      return {
        id: String(topic.id ?? `${sub.id}-${topicIndex}`),
        code,
        title: String(topic.title ?? ""),
      };
    });
  }

  const code = String(sub.code ?? "").trim() || String(loOrder);
  return [
    {
      id: String(sub.id ?? subIndex),
      code,
      title: String(sub.title ?? ""),
    },
  ];
}

function collectQualificationSections(
  units: Unit[],
  fallbackTitle: string,
): UnitSection[] {
  return units.map((unit, index) => {
    const parts = getQualificationUnitParts(unit, fallbackTitle, index);
    const subUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];
    const children = subUnits.map((sub, subIndex) => {
      const loOrder =
        Number(sub.showOrder) > 0 ? Number(sub.showOrder) : subIndex + 1;
      const loParts = getLearningOutcomeParts(sub, loOrder, fallbackTitle);
      return {
        id: `${unit.id}-lo-${sub.id ?? subIndex}`,
        unitLabel: loParts.unitLabel,
        titleLabel: loParts.titleLabel,
        rows: collectQualificationCriteria(sub, subIndex),
      };
    });

    return {
      unit,
      id: String(unit.id),
      unitLabel: parts.unitLabel,
      titleLabel: parts.titleLabel,
      rows: [],
      children,
    };
  });
}

function collectStandardSections(
  units: Unit[],
  fallbackTitle: string,
): UnitSection[] {
  const criteriaCode = buildStandardCriteriaCodes(units);

  return units.map((unit, index) => {
    const parts = getStandardUnitParts(unit, fallbackTitle, index);
    const subUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];
    const rows: CriteriaRow[] =
      subUnits.length > 0
        ? subUnits.map((sub, subIndex) => ({
            id: String(sub.id ?? `${unit.id}-${subIndex}`),
            code: criteriaCode(unit.id, sub.id),
            title: String(sub.title ?? ""),
          }))
        : [
            {
              id: String(unit.id),
              code: criteriaCode(unit.id, unit.id),
              title: String(unit.title ?? ""),
            },
          ];

    return {
      unit,
      id: String(unit.id),
      unitLabel: parts.unitLabel,
      titleLabel: parts.titleLabel,
      rows,
    };
  });
}

function sectionMatchesFilter(section: UnitSection, filter: string): boolean {
  if (!filter) return true;
  const haystack = [
    section.unitLabel,
    section.titleLabel,
    section.unit.title,
    section.unit.code,
    ...section.rows.map((row) => `${row.code} ${row.title}`),
    ...(section.children ?? []).flatMap((child) => [
      child.unitLabel,
      child.titleLabel,
      ...child.rows.map((row) => `${row.code} ${row.title}`),
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(filter);
}

function CriteriaTable({
  rows,
  codeHeader,
  titleHeader,
  emptyMessage,
}: {
  rows: CriteriaRow[];
  codeHeader: string;
  titleHeader: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="w-full table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">{codeHeader}</TableHead>
            <TableHead>{titleHeader}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="align-top font-mono text-xs">
                {row.code}
              </TableCell>
              <TableCell className="max-w-0 align-top">
                <div
                  className="line-clamp-3 max-w-xl whitespace-normal wrap-break-word text-sm"
                  title={row.title}
                >
                  {row.title}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ChooseUnitsDataTable({
  units,
  mandatoryUnitIds,
  isStandardCourse = false,
}: ChooseUnitsDataTableProps) {
  const { control, watch } = useFormContext<FormValues>();
  const selectedUnitIds = watch("selectedUnitIds");
  const t = useTranslations("chooseUnits");
  const [globalFilter, setGlobalFilter] = useState("");

  const unitHeader = isStandardCourse
    ? t("table.columns.ksb")
    : t("table.columns.unit");
  const codeHeader = isStandardCourse
    ? t("table.columns.ksb")
    : t("table.columns.srNo");

  const unitSections = useMemo(() => {
    const fallback = t("table.columns.unitName");
    return isStandardCourse
      ? collectStandardSections(units, fallback)
      : collectQualificationSections(units, fallback);
  }, [units, isStandardCourse, t]);

  const filteredSections = useMemo(() => {
    const filter = globalFilter.trim().toLowerCase();
    return unitSections.filter((section) =>
      sectionMatchesFilter(section, filter),
    );
  }, [unitSections, globalFilter]);

  const handleExportCsv = () => {
    toast.info(t("table.export.csvTodo"));
  };

  const handleExportPdf = () => {
    toast.info(t("table.export.pdfTodo"));
  };

  const renderUnitMeta = (unit: Unit) => (
    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="secondary" className={getTypeColor(unit.mandatory)}>
        {unit.mandatory
          ? t("table.types.mandatory")
          : t("table.types.optional")}
      </Badge>
      {!isStandardCourse && (
        <>
          <span>
            {t("table.columns.glh")}: {unit.glh || 0}
          </span>
          <span>
            {t("table.columns.level")}: {unit.level || "-"}
          </span>
          <span>
            {t("table.columns.credits")}: {unit.credit_value || 0}
          </span>
        </>
      )}
    </div>
  );

  const renderSelectCheckbox = (unit: Unit) => {
    const unitIdString = String(unit.id);
    const isMandatory = mandatoryUnitIds.includes(unitIdString);
    const isChecked = selectedUnitIds.includes(unitIdString);

    return (
      <Controller
        control={control}
        name="selectedUnitIds"
        render={({ field }) => {
          const handleCheckedChange = (checked: boolean) => {
            if (isMandatory) return;
            const currentIds = field.value || [];
            if (checked) {
              field.onChange([...currentIds, unitIdString]);
            } else {
              field.onChange(currentIds.filter((id) => id !== unitIdString));
            }
          };

          return (
            <Checkbox
              checked={isChecked}
              disabled={isMandatory}
              onCheckedChange={handleCheckedChange}
              aria-label={t("table.aria.selectUnit", {
                unitTitle: unit.title,
              })}
              className="mt-1"
            />
          );
        }}
      />
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.searchPlaceholder")}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredSections.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-muted-foreground">
          {t("table.noResults")}
        </div>
      ) : (
        <div className="w-full min-w-0 space-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-8 shrink-0 text-center text-xs font-semibold text-muted-foreground">
              {t("table.columns.select")}
            </span>
            <div className="min-w-0 flex-1">
              <UnitHierarchyHeader
                unitLabel={unitHeader}
                titleLabel={t("table.columns.title")}
              />
            </div>
          </div>

          <Accordion
            type="multiple"
            defaultValue={[]}
            className="w-full min-w-0 space-y-3"
          >
            {filteredSections.map((section) => (
              <div key={section.id} className="flex min-w-0 items-start gap-3">
                <div className="flex w-8 shrink-0 justify-center pt-4">
                  {renderSelectCheckbox(section.unit)}
                </div>
                <div className="min-w-0 flex-1">
                  <UnitAccordionItem
                    value={section.id}
                    unitLabel={section.unitLabel}
                    titleLabel={section.titleLabel}
                  >
                    {renderUnitMeta(section.unit)}

                    {section.children && section.children.length > 0 ? (
                      <Accordion
                        type="multiple"
                        defaultValue={[]}
                        className="w-full space-y-2"
                      >
                        {section.children.map((child) => (
                          <UnitAccordionItem
                            key={child.id}
                            value={child.id}
                            unitLabel={child.unitLabel}
                            titleLabel={child.titleLabel}
                            nested
                          >
                            <CriteriaTable
                              rows={child.rows}
                              codeHeader={codeHeader}
                              titleHeader={t(
                                "table.columns.assessmentCriteria",
                              )}
                              emptyMessage={t("table.noTopics")}
                            />
                          </UnitAccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <CriteriaTable
                        rows={section.rows}
                        codeHeader={codeHeader}
                        titleHeader={
                          isStandardCourse
                            ? t("table.columns.title")
                            : t("table.columns.assessmentCriteria")
                        }
                        emptyMessage={t("table.noTopics")}
                      />
                    )}
                  </UnitAccordionItem>
                </div>
              </div>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
