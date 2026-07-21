"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import {
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Minus, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { toast } from "sonner";
import { exportGapAnalysisToPdf } from "@/utils/pdfExport";
import { LearnerCourse } from "@/store/api/learner/types";
import {
  selectCurrentCourseId,
  setCurrentCourseId,
} from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";

export type SubUnitRow = {
  id: string | number;
  subTitle: string;
  learnerMap: boolean;
  trainerMap: boolean;
  gap: "complete" | "partial" | "none";
  comment: string;
  isSubUnitHeader?: boolean;
};

type StandardItem = {
  id: number | string;
  title: string;
  code: string;
  type: "Knowledge" | "Behaviour" | "Skills";
  mandatory?: boolean;
  completed?: boolean;
  evidenceBoxes?: Array<{
    mapping_id: number;
    assignment_id: number;
    learnerMap: boolean;
    trainerMap: boolean;
    sub_unit_id: number | null;
  }>;
};

type QualificationTopic = {
  id: string | number;
  code: string;
  showOrder: number;
  type: "Knowledge" | "Behaviour" | "Skills";
  title: string;
  evidenceBoxes?: Array<{
    mapping_id: number;
    assignment_id: number;
    learnerMap: boolean;
    trainerMap: boolean;
    sub_unit_id: number | null;
  }>;
};

type QualificationSubUnit = {
  id: number | string;
  title: string;
  code: string;
  type: string;
  showOrder: number;
  timesMet?: number;
  topics?: QualificationTopic[];
};

type QualificationUnit = {
  id: number | string;
  title: string;
  code: string;
  level?: string;
  credit_value?: number;
  glh?: number;
  mandatory?: boolean;
  subUnit?: QualificationSubUnit[];
};

type CourseWithUnits = {
  course_id: number;
  course_name: string;
  course_core_type?: string | null;
  units?: Array<
    | QualificationUnit
    | {
        id: number | string;
        title: string;
        type?: string;
        subUnit?: Array<{
          id: number | string;
          subTitle: string;
          learnerMap: boolean;
          trainerMap: boolean;
          comment?: string;
        }>;
        items?: StandardItem[];
      }
  >;
};

type UnitWithSubUnits = {
  id: number | string;
  title: string;
  subUnit?: Array<{
    id: number | string;
    subTitle: string;
    learnerMap: boolean;
    trainerMap: boolean;
    comment?: string;
  }>;
};

function escapeCsvCell(value: string | number | boolean): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function gapFromMaps(
  learnerMap: boolean,
  trainerMap: boolean,
): SubUnitRow["gap"] {
  if (learnerMap && trainerMap) return "complete";
  if (learnerMap || trainerMap) return "partial";
  return "none";
}

type MappingSource = {
  learnerMap?: boolean;
  trainerMap?: boolean;
  learner_map?: boolean;
  trainer_map?: boolean;
  completed?: boolean;
  evidenceBoxes?: Array<{
    learnerMap?: boolean;
    trainerMap?: boolean;
  }>;
};

/** Reads learner/trainer map flags from the node or its evidenceBoxes; inherits parent subUnit when topic has no explicit flags. */
function readMappingFlags(
  source: MappingSource,
  parentSub?: MappingSource,
): { learnerMap: boolean; trainerMap: boolean } {
  const learnerFromBoxes =
    source.evidenceBoxes?.some((box) => box.learnerMap) ?? false;
  const trainerFromBoxes =
    source.evidenceBoxes?.some((box) => box.trainerMap) ?? false;

  const hasDirectOrBoxFlags =
    source.learnerMap !== undefined ||
    source.trainerMap !== undefined ||
    source.learner_map !== undefined ||
    source.trainer_map !== undefined ||
    learnerFromBoxes ||
    trainerFromBoxes;

  if (hasDirectOrBoxFlags) {
    return {
      learnerMap: Boolean(
        source.learnerMap ?? source.learner_map ?? learnerFromBoxes,
      ),
      trainerMap: Boolean(
        source.trainerMap ?? source.trainer_map ?? trainerFromBoxes,
      ),
    };
  }

  if (parentSub) {
    return readMappingFlags(parentSub);
  }

  return { learnerMap: false, trainerMap: false };
}

function buildGapRow(
  id: string | number,
  subTitle: string,
  flags: { learnerMap: boolean; trainerMap: boolean },
  comment: string,
): SubUnitRow {
  return {
    id,
    subTitle,
    learnerMap: flags.learnerMap,
    trainerMap: flags.trainerMap,
    gap: gapFromMaps(flags.learnerMap, flags.trainerMap),
    comment,
  };
}

function collectQualificationGapRows(
  unit: UnitWithSubUnits | QualificationUnit,
): SubUnitRow[] {
  const rows: SubUnitRow[] = [];
  const subUnits = unit.subUnit ?? [];

  for (const subRaw of subUnits) {
    const sub = subRaw as MappingSource & {
      id?: string | number;
      title?: string;
      subTitle?: string;
      comment?: string;
      code?: string;
      topics?: Array<
        MappingSource & {
          id?: string | number;
          title?: string;
          comment?: string;
          code?: string;
        }
      >;
    };

    if (Array.isArray(sub.topics) && sub.topics.length > 0) {
      for (const topic of sub.topics) {
        const flags = readMappingFlags(topic, sub);
        rows.push(
          buildGapRow(
            `${String(sub.id ?? "sub")}-${String(topic.id ?? rows.length)}`,
            String(topic.title ?? ""),
            flags,
            String(topic.comment ?? topic.code ?? ""),
          ),
        );
      }
      continue;
    }

    const title = String(sub.title ?? sub.subTitle ?? "");
    rows.push(
      buildGapRow(
        sub.id ?? rows.length,
        title,
        readMappingFlags(sub),
        String(sub.comment ?? sub.code ?? ""),
      ),
    );
  }

  return rows;
}

type StandardGapTypeFilter = "all" | "Knowledge" | "Behaviour" | "Skills";

function collectStandardGapRows(
  course: CourseWithUnits,
  selectedType: StandardGapTypeFilter,
): SubUnitRow[] {
  const rows: SubUnitRow[] = [];
  const units = (course.units || []) as unknown[];
  const showAll = selectedType === "all";

  for (const raw of units) {
    const unit = raw as Record<string, unknown> & {
      id?: string | number;
      title?: string;
      type?: string;
      code?: string;
      subUnit?: unknown[];
      items?: StandardItem[];
      evidenceBoxes?: StandardItem["evidenceBoxes"];
      learnerMap?: boolean;
      trainerMap?: boolean;
    };

    const unitSubUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];

    if (unitSubUnits.length > 0) {
      const matchingSubUnits = showAll
        ? unitSubUnits
        : unitSubUnits.filter(
            (sub) =>
              String((sub as { type?: string }).type) === String(selectedType),
          );
      const matchesByUnitType =
        showAll || String(unit.type) === String(selectedType);
      if (!matchesByUnitType && matchingSubUnits.length === 0) continue;

      const subsToShow = matchesByUnitType ? unitSubUnits : matchingSubUnits;
      for (const subRaw of subsToShow) {
        const sub = subRaw as {
          id?: string | number;
          title?: string;
          subTitle?: string;
          code?: string;
          learnerMap?: boolean;
          trainerMap?: boolean;
          learner_map?: boolean;
          trainer_map?: boolean;
        };
        const learnerMap = Boolean(sub.learnerMap ?? sub.learner_map ?? false);
        const trainerMap = Boolean(sub.trainerMap ?? sub.trainer_map ?? false);
        const title = String(sub.title ?? sub.subTitle ?? "");
        const code = String(sub.code ?? "");
        const subId = `${String(unit.id ?? "u")}-${String(sub.id ?? sub.code ?? rows.length)}`;
        rows.push({
          id: subId,
          subTitle: title,
          learnerMap,
          trainerMap,
          gap: gapFromMaps(learnerMap, trainerMap),
          comment: code,
        });
      }
      continue;
    }

    if (Array.isArray(unit.items) && unit.items.length > 0) {
      for (const item of unit.items) {
        if (!showAll && String(item.type) !== String(selectedType)) continue;
        const hasLearnerMap =
          item.evidenceBoxes?.some((box) => box.learnerMap) || false;
        const hasTrainerMap =
          item.evidenceBoxes?.some((box) => box.trainerMap) || false;
        rows.push({
          id: item.id,
          subTitle: item.title,
          learnerMap: hasLearnerMap,
          trainerMap: hasTrainerMap,
          gap: gapFromMaps(hasLearnerMap, hasTrainerMap),
          comment: item.code || "",
        });
      }
      continue;
    }

    if (
      (unit.title != null || unit.id != null) &&
      (showAll ||
        (unit.type != null && String(unit.type) === String(selectedType)))
    ) {
      const hasLearnerMap =
        Boolean(unit.learnerMap ?? (unit as { learner_map?: boolean }).learner_map) ||
        unit.evidenceBoxes?.some((box) => box.learnerMap) ||
        false;
      const hasTrainerMap =
        Boolean(unit.trainerMap ?? (unit as { trainer_map?: boolean }).trainer_map) ||
        unit.evidenceBoxes?.some((box) => box.trainerMap) ||
        false;
      rows.push({
        id: unit.id ?? rows.length,
        subTitle: String(unit.title ?? ""),
        learnerMap: hasLearnerMap,
        trainerMap: hasTrainerMap,
        gap: gapFromMaps(hasLearnerMap, hasTrainerMap),
        comment: String(unit.code ?? ""),
      });
    }
  }

  return rows;
}

function filterSubUnitRows(
  rows: SubUnitRow[],
  globalFilter: string,
): SubUnitRow[] {
  if (!globalFilter) return rows;
  const filter = globalFilter.toLowerCase();
  return rows.filter(
    (row) =>
      row.subTitle.toLowerCase().includes(filter) ||
      row.comment.toLowerCase().includes(filter),
  );
}

type GapCompletionFilter = "all" | "completed" | "nonCompleted";

function filterSubUnitRowsByCompletion(
  rows: SubUnitRow[],
  completionFilter: GapCompletionFilter,
): SubUnitRow[] {
  if (completionFilter === "all") return rows;
  if (completionFilter === "completed") {
    return rows.filter((row) => row.gap === "complete");
  }
  return rows.filter((row) => row.gap === "none");
}

function applySubUnitFilters(
  rows: SubUnitRow[],
  globalFilter: string,
  completionFilter: GapCompletionFilter,
): SubUnitRow[] {
  return filterSubUnitRowsByCompletion(
    filterSubUnitRows(rows, globalFilter),
    completionFilter,
  );
}

type GapSubUnitTableProps = {
  rows: SubUnitRow[];
  columns: ColumnDef<SubUnitRow>[];
  globalFilter: string;
  completionFilter: GapCompletionFilter;
  emptyMessage: string;
  t: (key: string, values?: Record<string, string | number>) => string;
};

function GapSubUnitTable({
  rows,
  columns,
  globalFilter,
  completionFilter,
  emptyMessage,
  t,
}: GapSubUnitTableProps) {
  const filteredData = useMemo(
    () => applySubUnitFilters(rows, globalFilter, completionFilter),
    [rows, globalFilter, completionFilter],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {completionFilter !== "all" || globalFilter
          ? t("table.empty.noCriteriaForFilter")
          : t("table.noResults")}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table className="w-full table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.id === "subTitle" ? "w-[55%]" : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "subTitle" ? "max-w-0" : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export function ModuleUnitProgressDataTable() {
  const t = useTranslations("gapAnalysis");
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCourseIdParam = searchParams.get("course_id");
  const courses = useAppSelector((state) => state.auth.courses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const prevUrlCourseId = useRef<string | undefined>(undefined);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithUnits | null>(
    currentCourseId
      ? courses.find((c) => (c.course || c).course_id === currentCourseId)?.course || null
      : null,
  );
  const [selectedType, setSelectedType] =
    useState<StandardGapTypeFilter>("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [completionFilter, setCompletionFilter] =
    useState<GapCompletionFilter>("all");

  const isStandardCourse = selectedCourse?.course_core_type === "Standard";

  useEffect(() => {
    const raw = urlCourseIdParam ?? "";
    if (raw === prevUrlCourseId.current) return;
    prevUrlCourseId.current = raw;
    if (!urlCourseIdParam) return;
    const n = Number(urlCourseIdParam);
    if (!Number.isFinite(n) || n <= 0) return;
    dispatch(setCurrentCourseId(n));
  }, [urlCourseIdParam, dispatch]);

  useEffect(() => {
    const fromUrl =
      urlCourseIdParam &&
      Number.isFinite(Number(urlCourseIdParam)) &&
      Number(urlCourseIdParam) > 0
        ? Number(urlCourseIdParam)
        : null;
    const rid = selectCurrentCourseId(store.getState());
    const targetId = rid != null && rid > 0 ? rid : fromUrl;
    if (!targetId) return;
    const match = courses.find(
      (c: LearnerCourse) => c?.course?.course_id === targetId,
    );
    if (!match?.course) return;
    if (selectedCourse?.course_id !== targetId) {
      setSelectedCourse(match.course as CourseWithUnits);
    }
  }, [courses, currentCourseId, urlCourseIdParam, selectedCourse?.course_id, store]);

  useEffect(() => {
    if (isStandardCourse) {
      setSelectedType("all");
    }
    setCompletionFilter("all");
    setGlobalFilter("");
  }, [selectedCourse, isStandardCourse]);

  const standardRows = useMemo(() => {
    if (!isStandardCourse || !selectedCourse || !selectedType) return [];
    return collectStandardGapRows(selectedCourse, selectedType);
  }, [selectedCourse, selectedType, isStandardCourse]);

  const qualificationUnitSections = useMemo(() => {
    if (isStandardCourse || !selectedCourse?.units?.length) return [];
    return selectedCourse.units.map((unit, index) => {
      const typedUnit = unit as UnitWithSubUnits | QualificationUnit;
      return {
        id: String(typedUnit.id ?? `${index}-${typedUnit.title ?? "unit"}`),
        title: String(typedUnit.title ?? t("table.empty.selectUnit")),
        rows: collectQualificationGapRows(typedUnit),
      };
    });
  }, [isStandardCourse, selectedCourse?.units, t]);

  const standardFilteredData = useMemo(
    () => applySubUnitFilters(standardRows, globalFilter, completionFilter),
    [standardRows, globalFilter, completionFilter],
  );

  const allQualificationRows = useMemo(
    () => qualificationUnitSections.flatMap((section) => section.rows),
    [qualificationUnitSections],
  );

  const qualificationFilteredData = useMemo(
    () =>
      applySubUnitFilters(allQualificationRows, globalFilter, completionFilter),
    [allQualificationRows, globalFilter, completionFilter],
  );

  const exportRows = isStandardCourse
    ? standardFilteredData
    : qualificationFilteredData;

  const hasQualificationContent = qualificationUnitSections.length > 0;
  const showStandardTable =
    isStandardCourse && selectedType && standardRows.length > 0;
  const showQualificationAccordion =
    !isStandardCourse && selectedCourse && hasQualificationContent;
  const showToolbar =
    Boolean(selectedCourse) &&
    (isStandardCourse ? Boolean(selectedType) : hasQualificationContent);

  const columns: ColumnDef<SubUnitRow>[] = useMemo(() => {
    const baseColumns: ColumnDef<SubUnitRow>[] = [
      {
        accessorKey: "subTitle",
        header: isStandardCourse
          ? t("table.columns.title")
          : t("table.columns.subUnitTitle"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const title = String(row.getValue("subTitle") ?? "");
          return (
            <div
              className="max-w-2xl truncate font-medium"
              title={title}
            >
              {title}
            </div>
          );
        },
      },
    ];

    if (isStandardCourse) {
      baseColumns.push({
        accessorKey: "comment",
        header: t("table.columns.code"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const code = row.getValue("comment") as string;
          return <div className="font-mono text-sm font-medium">{code || "-"}</div>;
        },
      });
    }

    baseColumns.push(
      {
        accessorKey: "learnerMap",
        header: t("table.columns.learnerMap"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const learnerMap = row.getValue("learnerMap") as boolean;
          const isHeader = row.original.isSubUnitHeader;
          if (isHeader) return <div className="text-start">-</div>;
          return (
            <div className="text-start">
              {learnerMap ? (
                <span className="text-accent text-start">{t("table.yes")}</span>
              ) : (
                <span className="text-muted-foreground text-start">{t("table.no")}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "trainerMap",
        header: t("table.columns.trainerMap"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const trainerMap = row.getValue("trainerMap") as boolean;
          const isHeader = row.original.isSubUnitHeader;
          if (isHeader) return <div className="text-start">-</div>;
          return (
            <div className="text-start">
              {trainerMap ? (
                <span className="text-accent text-start">{t("table.yes")}</span>
              ) : (
                <span className="text-muted-foreground text-start">{t("table.no")}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "gap",
        header: t("table.columns.gap"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const gap = row.getValue("gap") as "complete" | "partial" | "none";
          const isHeader = row.original.isSubUnitHeader;
          if (isHeader) return <div className="text-start">-</div>;

          const getGapColor = () => {
            switch (gap) {
              case "complete":
                return "bg-accent";
              case "partial":
                return "bg-secondary";
              case "none":
                return "bg-destructive";
              default:
                return "bg-muted-foreground/30";
            }
          };

          return (
            <div className="flex items-center justify-start">
              <div
                className={`h-6 w-full max-w-[100px] rounded ${getGapColor()}`}
                title={
                  gap === "complete"
                    ? t("table.gapTooltip.complete")
                    : gap === "partial"
                      ? t("table.gapTooltip.partial")
                      : t("table.gapTooltip.none")
                }
              />
            </div>
          );
        },
      },
    );

    // if (!isStandardCourse) {
    //   baseColumns.push({
    //     accessorKey: "comment",
    //     header: t("table.columns.comment"),
    //     cell: ({ row }: { row: Row<SubUnitRow> }) => {
    //       const comment = row.getValue("comment") as string;
    //       return (
    //         <div className="max-w-[300px] truncate text-sm text-muted-foreground">
    //           {comment || "-"}
    //         </div>
    //       );
    //     },
    //   });
    // }

    return baseColumns;
  }, [isStandardCourse, t]);

  const gapStatusLabel = (gap: SubUnitRow["gap"]) => {
    switch (gap) {
      case "complete":
        return t("table.gapStatus.complete");
      case "partial":
        return t("table.gapStatus.partial");
      default:
        return t("table.gapStatus.none");
    }
  };

  const mapRowToPdfExport = (row: SubUnitRow) => ({
    subTitle: row.subTitle,
    learnerMap: row.learnerMap ? t("table.yes") : t("table.no"),
    trainerMap: row.trainerMap ? t("table.yes") : t("table.no"),
    gap: row.gap,
    comment: row.comment,
  });

  const buildExportFilename = (extension: "csv" | "pdf") => {
    const rawCourseName = selectedCourse?.course_name?.trim() || "course";
    const safeCourse =
      rawCourseName
        .replace(/[^a-zA-Z0-9\s_-]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 80) || "course";
    return `gap_analysis_${safeCourse}_${new Date().toISOString().split("T")[0]}.${extension}`;
  };

  const handleExportCsv = () => {
    if (exportRows.length === 0) {
      toast.info(t("table.toast.noDataToExport"));
      return;
    }

    const headers = isStandardCourse
      ? [
          t("table.columns.title"),
          t("table.columns.code"),
          t("table.columns.learnerMap"),
          t("table.columns.trainerMap"),
          t("table.columns.gap"),
        ]
      : [
          t("table.columns.subUnitTitle"),
          t("table.columns.learnerMap"),
          t("table.columns.trainerMap"),
          t("table.columns.gap"),
          t("table.columns.comment"),
        ];

    const rows = exportRows.map((row) =>
      isStandardCourse
        ? [
            row.subTitle,
            row.comment,
            row.learnerMap ? t("table.yes") : t("table.no"),
            row.trainerMap ? t("table.yes") : t("table.no"),
            gapStatusLabel(row.gap),
          ]
        : [
            row.subTitle,
            row.learnerMap ? t("table.yes") : t("table.no"),
            row.trainerMap ? t("table.yes") : t("table.no"),
            gapStatusLabel(row.gap),
            row.comment,
          ],
    );

    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportFilename("csv");
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("table.toast.csvSuccess"));
  };

  const handleExportPdf = () => {
    const headers = isStandardCourse
      ? [
          t("table.columns.title"),
          t("table.columns.code"),
          t("table.columns.learnerMap"),
          t("table.columns.trainerMap"),
          t("table.columns.gap"),
        ]
      : [
          t("table.columns.subUnitTitle"),
          t("table.columns.learnerMap"),
          t("table.columns.trainerMap"),
          t("table.columns.gap"),
          t("table.columns.comment"),
        ];

    const unitSections = isStandardCourse
      ? [
          {
            unitTitle: "",
            rows: exportRows.map(mapRowToPdfExport),
          },
        ]
      : qualificationUnitSections.map((section) => ({
          unitTitle: section.title,
          rows: applySubUnitFilters(
            section.rows,
            globalFilter,
            completionFilter,
          ).map(mapRowToPdfExport),
        }));

    const canExportPdf = isStandardCourse
      ? exportRows.length > 0
      : qualificationUnitSections.length > 0;

    if (!canExportPdf) {
      toast.info(t("table.toast.noDataToExport"));
      return;
    }

    void exportGapAnalysisToPdf({
      title: t("table.pdfTitle"),
      courseName: selectedCourse?.course_name,
      headers,
      unitSections,
      isStandardCourse,
      filename: buildExportFilename("pdf"),
    });
    toast.success(t("table.toast.pdfSuccess"));
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardContent className="">
          <div
            className={`grid gap-4 ${isStandardCourse ? "sm:grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
          >
            <div className="space-y-2">
              <Label htmlFor="course-select" className="text-sm font-medium">
                {t("table.filters.selectCourse")}
              </Label>
              <Select
                value={selectedCourse?.course_id?.toString() || ""}
                onValueChange={(value) => {
                  const course = courses.find(
                    (c: LearnerCourse) =>
                      c?.course?.course_id?.toString() === value,
                  );
                  const next = course?.course || null;
                  setSelectedCourse(next);
                  const nextId = next?.course_id ?? null;
                  dispatch(setCurrentCourseId(nextId));
                  const params = new URLSearchParams(searchParams.toString());
                  if (nextId != null) {
                    params.set("course_id", String(nextId));
                  } else {
                    params.delete("course_id");
                  }
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, {
                    scroll: false,
                  });
                }}
                disabled={!courses || courses.length === 0}
              >
                <SelectTrigger id="course-select" className="cursor-pointer">
                  <SelectValue
                    placeholder={
                      !courses
                        ? t("table.filters.noCourses")
                        : t("table.filters.selectCoursePlaceholder")
                    }
                  />
                  <SelectContent>
                    {courses.map((course: LearnerCourse, index: number) => (
                      <SelectItem
                        key={index}
                        value={course.course.course_id?.toString()}
                      >
                        {course.course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            {isStandardCourse ? (
              <div className="space-y-2">
                <Label htmlFor="type-select" className="text-sm font-medium">
                  {t("table.filters.selectType")}
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value as StandardGapTypeFilter);
                  }}
                  disabled={!selectedCourse}
                >
                  <SelectTrigger id="type-select" className="cursor-pointer">
                    <SelectValue
                      placeholder={
                        !selectedCourse
                          ? t("table.filters.selectCourseFirst")
                          : t("table.filters.selectTypePlaceholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("table.types.all")}
                    </SelectItem>
                    <SelectItem value="Knowledge">
                      {t("table.types.knowledge")}
                    </SelectItem>
                    <SelectItem value="Behaviour">
                      {t("table.types.behaviour")}
                    </SelectItem>
                    <SelectItem value="Skills">
                      {t("table.types.skills")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {showToolbar && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
          <div className="w-full max-w-sm space-y-2 sm:w-auto sm:space-y-0">
            <Label htmlFor="criteria-filter" className="sr-only">
              {t("table.filters.selectCriteriaStatus")}
            </Label>
            <Select
              value={completionFilter}
              onValueChange={(value) =>
                setCompletionFilter(value as GapCompletionFilter)
              }
            >
              <SelectTrigger id="criteria-filter" className="w-full cursor-pointer sm:w-[260px]">
                <SelectValue placeholder={t("table.filters.selectCriteriaStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("table.filters.showAllCriteria")}
                </SelectItem>
                <SelectItem value="nonCompleted">
                  {t("table.filters.showNonCompletedCriteria")}
                </SelectItem>
                <SelectItem value="completed">
                  {t("table.filters.showCompletedCriteria")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                {t("table.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                {t("table.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                {t("table.exportPdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      )}

      {showStandardTable ? (
        <GapSubUnitTable
          rows={standardRows}
          columns={columns}
          globalFilter={globalFilter}
          completionFilter={completionFilter}
          emptyMessage={t("table.empty.noItemsForType")}
          t={t}
        />
      ) : showQualificationAccordion ? (
        <Accordion
          key={`${selectedCourse?.course_id ?? "course"}-${completionFilter}`}
          type="multiple"
          defaultValue={[]}
          className="w-full space-y-3"
        >
          {qualificationUnitSections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="overflow-hidden rounded-md border border-border bg-white last:border-b"
            >
              <AccordionTrigger className="cursor-pointer bg-white px-4 py-4 text-left font-semibold hover:bg-white hover:no-underline data-[state=open]:[&_.unit-accordion-plus]:hidden data-[state=closed]:[&_.unit-accordion-minus]:hidden [&>svg]:hidden">
                <span className="flex w-full items-center gap-3">
                  <span className="relative flex size-5 shrink-0 items-center justify-center text-muted-foreground">
                    <Plus className="unit-accordion-plus size-4" />
                    <Minus className="unit-accordion-minus absolute size-4" />
                  </span>
                  <span className="truncate">{section.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="border-t bg-white px-4 pb-4">
                <GapSubUnitTable
                  rows={section.rows}
                  columns={columns}
                  globalFilter={globalFilter}
                  completionFilter={completionFilter}
                  emptyMessage={t("table.empty.noSubUnits")}
                  t={t}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              {!selectedCourse
                ? t("table.empty.selectCourse")
                : isStandardCourse
                  ? !selectedType
                    ? t("table.empty.selectType")
                    : t("table.empty.noItemsForType")
                  : hasQualificationContent
                    ? t("table.empty.noSubUnits")
                    : t("table.filters.noUnits")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

