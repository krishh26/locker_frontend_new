"use client";

import { useState, useEffect, useMemo } from "react";
import {
  type ColumnDef,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search } from "lucide-react";

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
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { exportTableToPdf } from "@/utils/pdfExport";
import { LearnerCourse } from "@/store/api/learner/types";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";
import { useTranslations } from "next-intl";

export type SubUnitRow = {
  id: string | number;
  subTitle: string;
  learnerMap: boolean;
  trainerMap: boolean;
  gap: "complete" | "partial" | "none";
  comment: string;
  isSubUnitHeader?: boolean; // For Qualification courses to distinguish subUnit headers from topics
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
        // For Standard courses, units may contain items directly
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

/** Merge nested `course` with `units` from inner course or LearnerCourse wrapper (matches Evidence / skills-scan shapes). */
function resolveCourseFromLearnerEntry(
  learnerCourse: LearnerCourse | undefined | null,
): CourseWithUnits | null {
  if (!learnerCourse) return null;
  const inner = learnerCourse.course;
  if (!inner?.course_id) return null;
  const wrapperUnits = (learnerCourse as { units?: unknown }).units;
  const innerUnits = (inner as { units?: unknown }).units;
  const mergedUnits =
    Array.isArray(innerUnits) && innerUnits.length > 0
      ? innerUnits
      : Array.isArray(wrapperUnits)
        ? wrapperUnits
        : [];
  return {
    ...(inner as CourseWithUnits),
    units: mergedUnits as CourseWithUnits["units"],
  };
}

type StandardGapRowSource = {
  id: string | number;
  title: string;
  code: string;
  evidenceBoxes?: StandardItem["evidenceBoxes"];
  learnerMapDirect?: boolean;
  trainerMapDirect?: boolean;
};

function isKbsType(type: unknown): type is "Knowledge" | "Behaviour" | "Skills" {
  return type === "Knowledge" || type === "Behaviour" || type === "Skills";
}

/** Flatten Standard course `units` into rows for the selected K/B/S type (parent items, unit.items[], or unit.subUnit[]). */
function collectStandardGapRows(
  units: unknown[] | undefined,
  selectedType: "Knowledge" | "Behaviour" | "Skills",
): StandardGapRowSource[] {
  if (!Array.isArray(units) || units.length === 0) return [];
  const rows: StandardGapRowSource[] = [];

  for (const raw of units) {
    const unit = raw as Record<string, unknown>;
    const unitId = unit.id ?? unit.code ?? "";

    if (Array.isArray(unit.items) && unit.items.length > 0) {
      for (const item of unit.items as StandardItem[]) {
        if (!isKbsType(item.type) || item.type !== selectedType) continue;
        rows.push({
          id: item.id,
          title: item.title,
          code: item.code || "",
          evidenceBoxes: item.evidenceBoxes,
        });
      }
      continue;
    }

    const subUnits = unit.subUnit as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(subUnits) && subUnits.length > 0) {
      const matchingSubUnits = subUnits.filter(
        (sub) => String(sub.type) === String(selectedType),
      );
      const matchesByUnitType =
        unit.type !== undefined &&
        unit.type !== null &&
        String(unit.type) === String(selectedType);
      const matchesBySubUnitType = matchingSubUnits.length > 0;
      if (!matchesByUnitType && !matchesBySubUnitType) {
        continue;
      }
      const subsToEmit = matchesByUnitType ? subUnits : matchingSubUnits;
      for (const sub of subsToEmit) {
        const subId = sub.id ?? sub.code;
        const id =
          subId !== undefined && subId !== null
            ? `${String(unitId)}-${String(subId)}`
            : `${String(unitId)}-row-${rows.length}`;
        const title =
          (typeof sub.title === "string" && sub.title) ||
          (typeof sub.subTitle === "string" && sub.subTitle) ||
          (typeof unit.title === "string" && unit.title) ||
          "";
        const code =
          (typeof sub.code === "string" && sub.code) ||
          (typeof unit.code === "string" && unit.code) ||
          "";
        rows.push({
          id,
          title,
          code,
          evidenceBoxes: sub.evidenceBoxes as StandardItem["evidenceBoxes"] | undefined,
          learnerMapDirect: Boolean(sub.learnerMap),
          trainerMapDirect: Boolean(sub.trainerMap),
        });
      }
      continue;
    }

    if (
      unit.type !== undefined &&
      unit.type !== null &&
      String(unit.type) === String(selectedType) &&
      isKbsType(unit.type)
    ) {
      rows.push({
        id: unitId as string | number,
        title: (typeof unit.title === "string" && unit.title) || "",
        code: (typeof unit.code === "string" && unit.code) || "",
        evidenceBoxes: unit.evidenceBoxes as StandardItem["evidenceBoxes"] | undefined,
        learnerMapDirect: Boolean(unit.learnerMap),
        trainerMapDirect: Boolean(unit.trainerMap),
      });
    }
  }

  return rows;
}

function mapsFromStandardGapRow(row: StandardGapRowSource): {
  learnerMap: boolean;
  trainerMap: boolean;
} {
  const fromBoxesLearner = row.evidenceBoxes?.some((box) => box.learnerMap) ?? false;
  const fromBoxesTrainer = row.evidenceBoxes?.some((box) => box.trainerMap) ?? false;
  return {
    learnerMap: Boolean(row.learnerMapDirect) || fromBoxesLearner,
    trainerMap: Boolean(row.trainerMapDirect) || fromBoxesTrainer,
  };
}

export function ModuleUnitProgressDataTable() {
  const t = useTranslations("gapAnalysis");
  const courses = useAppSelector((state) => state.auth.courses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithUnits | null>(() =>
    currentCourseId
      ? resolveCourseFromLearnerEntry(
          courses.find((c) => c.course?.course_id === currentCourseId),
        )
      : null,
  );
  const [selectedUnit, setSelectedUnit] = useState<UnitWithSubUnits | QualificationUnit | null>(null);
  const [selectedType, setSelectedType] = useState<"Knowledge" | "Behaviour" | "Skills">("Knowledge");
  const [globalFilter, setGlobalFilter] = useState("");

  const isStandardCourse = selectedCourse?.course_core_type === "Standard";
  const isQualificationCourse = selectedCourse?.course_core_type === "Qualification";
  
  useEffect(() => {
    if (!isStandardCourse) return;
    setSelectedUnit(null);
    setSelectedType("Knowledge");
  }, [selectedCourse?.course_id, isStandardCourse]);

  useEffect(() => {
    if (isStandardCourse) return;
    if (isQualificationCourse || (!isStandardCourse && !isQualificationCourse)) {
      if (selectedCourse?.units && selectedCourse.units.length > 0) {
        setSelectedUnit(selectedCourse.units[0] as UnitWithSubUnits | QualificationUnit);
      } else {
        setSelectedUnit(null);
      }
    }
  }, [
    selectedCourse?.course_id,
    selectedCourse?.units,
    isStandardCourse,
    isQualificationCourse,
  ]);

  // For non-Standard courses, units are actual units
  // For Standard courses, units array contains items directly
  // For Qualification courses, units are QualificationUnit objects
  const units = useMemo(() => {
    if (isStandardCourse) {
      // For Standard courses, we don't need units selection
      return [];
    }
    return selectedCourse?.units || [];
  }, [selectedCourse, isStandardCourse]);

  const standardGapRows = useMemo(() => {
    if (!isStandardCourse || !selectedType || !selectedCourse?.units) {
      return [];
    }
    return collectStandardGapRows(
      selectedCourse.units as unknown[],
      selectedType,
    );
  }, [isStandardCourse, selectedCourse?.units, selectedType]);

  const tableData: SubUnitRow[] = useMemo(() => {
    // Handle Standard course flow
    if (isStandardCourse && selectedType) {
      return standardGapRows.map((item) => {
        const { learnerMap: hasLearnerMap, trainerMap: hasTrainerMap } =
          mapsFromStandardGapRow(item);

        let gap: "complete" | "partial" | "none" = "none";
        if (hasLearnerMap && hasTrainerMap) {
          gap = "complete";
        } else if (hasLearnerMap || hasTrainerMap) {
          gap = "partial";
        }

        return {
          id: item.id,
          subTitle: item.title,
          learnerMap: hasLearnerMap,
          trainerMap: hasTrainerMap,
          gap,
          comment: item.code || "",
        };
      });
    }

    // Handle Qualification course flow (original logic)
    if (!selectedUnit || !("subUnit" in selectedUnit) || !selectedUnit.subUnit || selectedUnit.subUnit.length === 0) {
      return [];
    }

    const firstSubUnit = selectedUnit.subUnit[0];
    if ("topics" in firstSubUnit) {
      return (firstSubUnit.topics as Array<{
        id: string | number;
        code: string;
        showOrder: number;
        type: "Knowledge" | "Behaviour" | "Skills";
        title: string;
        learnerMap: boolean;
        trainerMap: boolean;
        comment: string;
        evidenceBoxes?: Array<{
          mapping_id: number;
          assignment_id: number;
          learnerMap: boolean;
          trainerMap: boolean;
          sub_unit_id: number | null;
        }>;
      }>).map((topic) => {
        let gap: "complete" | "partial" | "none" = "none";
        if (topic.learnerMap && topic.trainerMap) {
          gap = "complete";
        } else if (topic.learnerMap || topic.trainerMap) {
          gap = "partial";
        }

        return {
          id: topic.id,
          subTitle: topic.title,
          learnerMap: topic.learnerMap,
          trainerMap: topic.trainerMap,
          gap,
          comment: topic.comment || "",
        };
      });
    }

    return [];
  }, [isStandardCourse, selectedType, standardGapRows, selectedUnit]);

  const filteredData = useMemo(() => {
    if (!globalFilter) return tableData;
    const filter = globalFilter.toLowerCase();
    return tableData.filter(
      (row) =>
        row.subTitle.toLowerCase().includes(filter) ||
        row.comment.toLowerCase().includes(filter)
    );
  }, [tableData, globalFilter]);

  const columns: ColumnDef<SubUnitRow>[] = useMemo(() => {
    const baseColumns: ColumnDef<SubUnitRow>[] = [
      {
        accessorKey: "subTitle",
        header: isStandardCourse ? t("table.columns.title") : t("table.columns.subUnitTitle"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => (
          <div className="font-medium">{row.getValue("subTitle")}</div>
        ),
      },
    ];

    if (isStandardCourse) {
      baseColumns.push({
        accessorKey: "comment",
        header: t("table.columns.code"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const code = row.getValue("comment") as string;
          return (
            <div className="font-mono text-sm font-medium">{code || "-"}</div>
          );
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
          if (isHeader) {
            return <div className="text-center">-</div>;
          }
          return (
            <div className="text-center">
              {learnerMap ? (
                <span className="text-accent">{t("table.yes")}</span>
              ) : (
                <span className="text-muted-foreground">{t("table.no")}</span>
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
          if (isHeader) {
            return <div className="text-center">-</div>;
          }
          return (
            <div className="text-center">
              {trainerMap ? (
                <span className="text-accent">{t("table.yes")}</span>
              ) : (
                <span className="text-muted-foreground">{t("table.no")}</span>
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
          if (isHeader) {
            return <div className="text-center">-</div>;
          }
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
            <div className="flex items-center justify-center">
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
      }
    );

    if (!isStandardCourse) {
      baseColumns.push({
        accessorKey: "comment",
        header: t("table.columns.comment"),
        cell: ({ row }: { row: Row<SubUnitRow> }) => {
          const comment = row.getValue("comment") as string;
          return (
            <div className="max-w-[300px] truncate text-sm text-muted-foreground">
              {comment || "-"}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [isStandardCourse, t]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
  });

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

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
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

    const rows = filteredData.map((row) =>
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
          ]
    );

    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const rawCourseName = selectedCourse?.course_name?.trim() || "course";
    const safeCourse =
      rawCourseName
        .replace(/[^a-zA-Z0-9\s_-]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .slice(0, 80) || "course";
    link.download = `gap_analysis_${safeCourse}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("table.toast.csvSuccess"));
  };

  const handleExportPdf = () => {
    const headers = isStandardCourse
      ? [t("table.columns.title"), t("table.columns.code"), t("table.columns.learnerMap"), t("table.columns.trainerMap"), t("table.columns.gap")]
      : [t("table.columns.subUnitTitle"), t("table.columns.learnerMap"), t("table.columns.trainerMap"), t("table.columns.gap"), t("table.columns.comment")];
    const rows = filteredData.map((row) =>
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
          ]
    );
    if (rows.length === 0) {
      toast.info(t("table.toast.noDataToExport"));
      return;
    }
    void exportTableToPdf({ title: t("table.pdfTitle"), headers, rows });
    toast.success(t("table.toast.pdfSuccess"));
  };

  return (
    <div className="w-full space-y-4">
      {/* Course and Unit/Type Selection */}
      <Card>
        <CardContent className="">
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-select" className="text-sm font-medium">
                {t("table.filters.selectCourse")}
              </Label>
              <Select
                value={selectedCourse?.course_id?.toString() || ""}
                onValueChange={(value) => {
                  const entry = courses.find(
                    (c: LearnerCourse) => c?.course?.course_id?.toString() === value
                  );
                  setSelectedCourse(resolveCourseFromLearnerEntry(entry));
                }}
                disabled={!courses || courses.length === 0}
              >
                <SelectTrigger id="course-select" className="cursor-pointer">
                  <SelectValue placeholder={!courses ? t("table.filters.noCourses") : t("table.filters.selectCoursePlaceholder")} />
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
                    setSelectedType(value as "Knowledge" | "Behaviour" | "Skills");
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
                    <SelectItem value="Knowledge">{t("table.types.knowledge")}</SelectItem>
                    <SelectItem value="Behaviour">{t("table.types.behaviour")}</SelectItem>
                    <SelectItem value="Skills">{t("table.types.skills")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="unit-select" className="text-sm font-medium">
                  {t("table.filters.selectUnit")}
                </Label>
                <Select
                  value={selectedUnit?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const unit = units.find((u) => u.id.toString() === value);
                    setSelectedUnit(unit || null);
                  }}
                  disabled={!selectedCourse || units.length === 0}
                >
                  <SelectTrigger id="unit-select" className="cursor-pointer">
                    <SelectValue
                      placeholder={
                        !selectedCourse
                          ? t("table.filters.selectCourseFirst")
                          : units.length === 0
                          ? t("table.filters.noUnits")
                          : t("table.filters.selectUnitPlaceholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit, index) => (
                      <SelectItem key={index} value={unit.id?.toString() || unit.title}>
                        {unit.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
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

      {/* Table */}
      {((isStandardCourse && selectedType && tableData.length > 0) ||
        (isQualificationCourse && selectedUnit && tableData.length > 0) ||
        (!isStandardCourse && !isQualificationCourse && selectedUnit && tableData.length > 0)) ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
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
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("table.noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {t("table.pagination.showing", {
                count: table.getRowModel().rows.length,
                total: filteredData.length,
                items: t(isStandardCourse ? "table.pagination.items" : "table.pagination.subUnits"),
              })}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">{t("table.pagination.page")}</p>
                <strong className="text-sm">
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </strong>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="cursor-pointer"
                >
                  {t("table.pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="cursor-pointer"
                >
                  {t("table.pagination.next")}
                </Button>
              </div>
            </div>
          </div>
        </>
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
                : isQualificationCourse
                ? !selectedUnit
                  ? t("table.empty.selectUnit")
                  : t("table.empty.noSubUnits")
                : !selectedUnit
                ? t("table.empty.selectUnit")
                : t("table.empty.noSubUnits")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

