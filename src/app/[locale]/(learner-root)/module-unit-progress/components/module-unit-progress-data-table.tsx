"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataTablePagination } from "@/components/data-table-pagination";
import type { UnitProgress } from "@/store/api/module-unit-progress/types";

export type UnitProgressRow = UnitProgress;

interface ModuleUnitProgressDataTableProps {
  units?: UnitProgress[];
  isLoading?: boolean;
}

export function ModuleUnitProgressDataTable({
  units = [],
  isLoading = false,
}: ModuleUnitProgressDataTableProps) {
  const t = useTranslations("moduleUnitProgress");
  const [globalFilter, setGlobalFilter] = React.useState("");

  const filteredData = useMemo(() => {
    if (!globalFilter) return units;
    const filter = globalFilter.toLowerCase();
    return units.filter((row) =>
      row.title.toLowerCase().includes(filter)
    );
  }, [units, globalFilter]);

  const columns: ColumnDef<UnitProgressRow>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: t("table.columns.title"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => (
          <div className="font-medium">{row.getValue("title")}</div>
        ),
      },
      {
        id: "signed_off_awaiting",
        header: t("table.columns.signedOffAwaiting"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => {
          const learnerProgress = row.original.learner_progress_percent ?? 0;
          const trainerProgress = row.original.trainer_progress_percent ?? 0;
          // Signed off is when trainer has completed (trainer_progress_percent)
          // Awaiting sign off is the difference or learner progress
          const signedOff = trainerProgress;
          const awaitingSignOff = Math.max(0, learnerProgress - trainerProgress);
          return (
            <div className="space-y-2 min-w-[200px]">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("table.progress.signedOff")}</span>
                  <span className="font-medium">{signedOff}%</span>
                </div>
                <Progress value={signedOff} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("table.progress.awaitingSignOff")}</span>
                  <span className="font-medium">{awaitingSignOff}%</span>
                </div>
                <Progress value={awaitingSignOff} className="h-2" />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "fully_completed",
        header: t("table.columns.completed"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => {
          const completed = row.original.fully_completed;
          if (completed === true) {
            return <span className="text-accent">{t("table.status.yes")}</span>;
          }
          return <span className="text-muted-foreground">{t("table.status.no")}</span>;
        },
      },
      {
        accessorKey: "assessed_date",
        header: t("table.columns.assessed"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => {
          const assessedDate = row.original.assessed_date;
          if (assessedDate) {
            return <span className="text-accent">{t("table.status.yes")}</span>;
          }
          return <span className="text-muted-foreground">{t("table.status.no")}</span>;
        },
      },
      {
        accessorKey: "iqa_sign_off",
        header: t("table.columns.iqaSignOff"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => {
          const iqaSignOff = row.original.iqa_sign_off;
          if (iqaSignOff === true || iqaSignOff === "Yes" || iqaSignOff === "yes") {
            return <span className="text-accent">{t("table.status.yes")}</span>;
          }
          if (iqaSignOff === false || iqaSignOff === "No" || iqaSignOff === "no" || iqaSignOff === null) {
            return <span className="text-muted-foreground">{t("table.status.no")}</span>;
          }
          return (
            <span className="text-muted-foreground">
              {String(iqaSignOff) || t("common.dash")}
            </span>
          );
        },
      },
      {
        id: "claimable_status",
        header: t("table.columns.claimableStatus"),
        cell: ({ row }: { row: Row<UnitProgressRow> }) => {
          // Derive claimable status from unit completion and sign-off
          const fullyCompleted = row.original.fully_completed;
          const iqaSignOff = row.original.iqa_sign_off;
          const assessedDate = row.original.assessed_date;
          
          if (fullyCompleted && iqaSignOff && assessedDate) {
            return <span className="text-sm text-accent">{t("table.status.claimable")}</span>;
          }
          return <span className="text-sm text-muted-foreground">{t("table.status.notClaimable")}</span>;
        },
      },
    ],
    [t]
  );

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground animate-pulse">
            {t("table.loading")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!units || units.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center text-muted-foreground">
            {t("table.noUnits")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
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
      </div>

      {/* Table */}
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
      <DataTablePagination table={table} />
    </div>
  );
}
