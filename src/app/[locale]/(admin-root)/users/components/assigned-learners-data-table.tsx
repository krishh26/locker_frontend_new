"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Download,
  Search,
  MoreHorizontal,
  Trash2,
  Folder,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import Link from "next/link";
import type { AssignedLearner } from "@/store/api/user/types";

interface AssignedLearnersDataTableProps {
  data: AssignedLearner[];
  onRemove: (learnerId: number, courseId: number) => Promise<void>;
  isLoading?: boolean;
}

export function AssignedLearnersDataTable({
  data,
  onRemove,
  isLoading = false,
}: AssignedLearnersDataTableProps) {
  const t = useTranslations("users.assignedLearners");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [learnerToRemove, setLearnerToRemove] = useState<AssignedLearner | null>(null);

  const handleSearch = useCallback(() => {
    // Client-side filtering is handled by TanStack Table
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setGlobalFilter("");
  };

  const handleRemoveClick = (learner: AssignedLearner) => {
    setLearnerToRemove(learner);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (!learnerToRemove) return;
    await onRemove(learnerToRemove.learner_id, learnerToRemove.course_id);
    setRemoveDialogOpen(false);
    setLearnerToRemove(null);
  };

  const handleExportCsv = () => {
    if (!data || data.length === 0) {
      toast.info(t("noDataToExport"));
      return;
    }

    const headers = [
      t("learnerName"),
      t("courseName"),
      t("courseStatus"),
      t("startDate"),
      t("endDate"),
    ];
    const rows = data.map((learner) => [
      `${learner.first_name} ${learner.last_name}`,
      learner.course_name,
      learner.course_status,
      learner.start_date,
      learner.end_date,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `assigned_learners_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("csvExported"));
  };

  const handleExportPdf = () => {
    toast.info(t("pdfExportInfo"));
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const columns: ColumnDef<AssignedLearner>[] = useMemo(
    () => [
      {
        accessorKey: "learner_name",
        header: t("learnerName"),
        cell: ({ row }) => {
          const learner = row.original;
          return `${learner.first_name} ${learner.last_name}`;
        },
      },
      {
        accessorKey: "portfolio",
        header: t("portfolio"),
        cell: ({ row }) => {
          const learner = row.original;
          return (
            <Link
              href={`/learner-profile?learner_id=${learner.learner_id}`}
              className="inline-flex items-center justify-center"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`${t("viewPortfolio")} ${learner.first_name} ${learner.last_name}`}
              >
                <Folder className="h-4 w-4" />
              </Button>
            </Link>
          );
        },
      },
      {
        accessorKey: "course_name",
        header: t("courseName"),
        cell: ({ row }) => row.original.course_name,
      },
      {
        accessorKey: "course_status",
        header: t("courseStatus"),
        cell: ({ row }) => row.original.course_status,
      },
      {
        accessorKey: "start_date",
        header: t("startDate"),
        cell: ({ row }) => formatDate(row.original.start_date),
      },
      {
        accessorKey: "end_date",
        header: t("endDate"),
        cell: ({ row }) => formatDate(row.original.end_date),
      },
      {
        id: "actions",
        header: t("actions"),
        cell: ({ row }) => {
          const learner = row.original;
          return (
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={() => handleRemoveClick(learner)}
                  className="cursor-pointer hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
          );
        },
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="space-y-2 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="sm:w-auto"
            >
              {t("clear")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                {t("export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                {t("exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                {t("exportPdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="min-w-[150px]">
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
                  {t("noAssignedLearners")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        table={table}
        manualPagination={false}
        currentPage={table.getState().pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        totalItems={data.length}
        pageSize={table.getState().pagination.pageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(newPageSize) => {
          table.setPageSize(newPageSize);
        }}
      />

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDialogDescription")}{" "}
              <strong>
                {learnerToRemove?.first_name} {learnerToRemove?.last_name}
              </strong>{" "}
              {t("removeDialogDescriptionEnd")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("removeDialogCancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("removeDialogConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
