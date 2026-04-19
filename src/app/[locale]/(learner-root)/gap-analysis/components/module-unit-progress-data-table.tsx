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

export function ModuleUnitProgressDataTable() {
  const t = useTranslations("gapAnalysis");
  const courses = useAppSelector((state) => state.auth.courses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithUnits | null>(currentCourseId ? courses.find((c) => (c.course || c).course_id === currentCourseId)?.course || null : null);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithSubUnits | QualificationUnit | null>(null);
  const [selectedType, setSelectedType] = useState<"Knowledge" | "Behaviour" | "Skills">("Knowledge");
  const [globalFilter, setGlobalFilter] = useState("");

  const isStandardCourse = selectedCourse?.course_core_type === "Standard";
  const isQualificationCourse = selectedCourse?.course_core_type === "Qualification";
  
  // Update selected unit when course changes (for non-Standard courses)
  useEffect(() => {
    if (isStandardCourse) {
      // For Standard courses, reset unit and type selection
      setSelectedUnit(null);
      setSelectedType("Knowledge");
    } else if (isQualificationCourse || (!isStandardCourse && !isQualificationCourse)) {
      // For Qualification and other courses, select first unit
      if (selectedCourse?.units && selectedCourse.units.length > 0) {
        setSelectedUnit(selectedCourse.units[0] as UnitWithSubUnits | QualificationUnit);
      } else {
        setSelectedUnit(null);
      }
    }
  }, [selectedCourse, isStandardCourse, isQualificationCourse]);

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

  // Collect all items from units array for Standard courses
  // For Standard courses, the units array IS the items array (each unit is an item)
  const allStandardItems = useMemo(() => {
    if (!isStandardCourse || !selectedCourse?.units) {
      return [];
    }

    // The units array directly contains items with type, code, title, evidenceBoxes, etc.
    return (selectedCourse.units as unknown as StandardItem[]).filter(
      (item) => item.type && (item.type === "Knowledge" || item.type === "Behaviour" || item.type === "Skills")
    );
  }, [selectedCourse, isStandardCourse]);

  // Filter items by selected type for Standard courses
  const filteredStandardItems = useMemo(() => {
    if (!isStandardCourse || !selectedType) {
      return [];
    }
    return allStandardItems.filter((item) => item.type === selectedType);
  }, [allStandardItems, selectedType, isStandardCourse]);

  const tableData: SubUnitRow[] = useMemo(() => {
    // Handle Standard course flow
    if (isStandardCourse && selectedType) {
      return filteredStandardItems.map((item) => {
        // Aggregate learnerMap and trainerMap from evidenceBoxes
        const hasLearnerMap = item.evidenceBoxes?.some((box) => box.learnerMap) || false;
        const hasTrainerMap = item.evidenceBoxes?.some((box) => box.trainerMap) || false;

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
          comment: item.code || "", // Store code in comment field for display
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
  }, [isStandardCourse, selectedType, filteredStandardItems, selectedUnit]);

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
                  const course = courses.find(
                    (c: LearnerCourse) => c?.course?.course_id?.toString() === value
                  );
                  setSelectedCourse(course?.course || null);
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

