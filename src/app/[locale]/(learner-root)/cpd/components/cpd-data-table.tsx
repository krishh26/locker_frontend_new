"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
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
  Plus,
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
import { useGetCpdEntriesQuery } from "@/store/api/cpd/cpdApi";
import { CpdEditableRow } from "./cpd-editable-row";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export type CpdTableHeader = {
  id: string;
  label: string;
  multiline: boolean;
};

export type CpdEntry = {
  id: string;
  user_id: string;
  activity: string;
  date: string;
  method: string;
  learning: string;
  impact: string;
};

interface CpdDataTableProps {
  onAddRow?: () => void;
}

function createEmptyRow(userId: string): CpdEntry {
  return {
    id: `temp-${Date.now()}-${Math.random()}`,
    user_id: userId,
    activity: "",
    date: "",
    method: "",
    learning: "",
    impact: "",
  };
}

export function CpdDataTable({ onAddRow }: CpdDataTableProps) {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || "temp";
  const isEmployer = user?.role === "Employer";
  const { data, isLoading } = useGetCpdEntriesQuery();
  const [tableData, setTableData] = useState<CpdEntry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const t = useTranslations("cpd");

  const defaultHeaders: CpdTableHeader[] = useMemo(
    () => [
      {
        id: "activity",
        label: t("table.headers.activity"),
        multiline: true,
      },
      {
        id: "date",
        label: t("table.headers.date"),
        multiline: false,
      },
      {
        id: "method",
        label: t("table.headers.method"),
        multiline: true,
      },
      {
        id: "learning",
        label: t("table.headers.learning"),
        multiline: true,
      },
      {
        id: "impact",
        label: t("table.headers.impact"),
        multiline: true,
      },
    ],
    [t]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (data?.data) {
      const formattedData: CpdEntry[] = data.data.map((item) => ({
        id: String(item.id || ""),
        user_id: String(item.user_id || ""),
        activity: item.what_training || "",
        date: item.date || "",
        method: item.how_you_did || "",
        learning: item.what_you_learned || "",
        impact: item.how_it_improved_work || "",
      }));

      const paddedData = [...formattedData];
      while (paddedData.length < 5) {
        paddedData.push(createEmptyRow(userId));
      }
      setTableData(paddedData);
    } else if (!isLoading) {
      const emptyRows: CpdEntry[] = [];
      while (emptyRows.length < 5) {
        emptyRows.push(createEmptyRow(userId));
      }
      setTableData(emptyRows);
    }
  }, [data, isLoading, userId]);

  const handleDeleteRow = useCallback((rowId: string) => {
    setTableData((prev) => prev.filter((row) => String(row.id) !== String(rowId)));
  }, []);

  const handleUpdateRow = useCallback(
    (rowId: string, updatedRow: Record<string, string>) => {
      setTableData((prev) =>
        prev.map((row) => (String(row.id) === String(rowId) ? { ...row, ...updatedRow } as CpdEntry : row))
      );
    },
    []
  );

  const handleAddNewRow = useCallback(() => {
    const newRow = createEmptyRow(userId);
    setTableData((prev) => [...prev, newRow]);
    if (onAddRow) {
      onAddRow();
    }
  }, [userId, onAddRow]);

  const handleExportCsv = () => {
    toast.info(t("table.export.csvTodo"));
  };

  const handleExportPdf = () => {
    toast.info(t("table.export.pdfTodo"));
  };

  const columns: ColumnDef<CpdEntry>[] = useMemo(
    () => [
      ...defaultHeaders.map((header) => ({
        accessorKey: header.id,
        header: header.label,
        cell: () => {
          // This will be handled by CpdEditableRow component
          return null;
        },
      })),
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: () => null, // Handled by CpdEditableRow
      },
    ],
    [defaultHeaders, t]
  );

  const filteredData = useMemo(() => {
    if (!globalFilter) return tableData;
    const filter = globalFilter.toLowerCase();
    return tableData.filter(
      (row) =>
        row.activity.toLowerCase().includes(filter) ||
        row.method.toLowerCase().includes(filter) ||
        row.learning.toLowerCase().includes(filter) ||
        row.impact.toLowerCase().includes(filter) ||
        row.date.includes(filter)
    );
  }, [tableData, globalFilter]);

  const table = useReactTable({
    data: filteredData,
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
  });

  const entryCount = tableData.filter((row) =>
    defaultHeaders.some((h) => row[h.id as keyof CpdEntry]?.toString().trim())
  ).length;

  if (!isMounted || isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            {t("table.status.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
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
                  {t("table.export.button")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                  {t("table.export.csv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                  {t("table.export.pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isEmployer && (
            <Button onClick={handleAddNewRow} className="cursor-pointer">
              <Plus className="mr-2 size-4" />
              {t("table.addNew")}
            </Button>
          )}
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
                    <TableHead key={header.id} className="min-w-[200px]">
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
                <CpdEditableRow
                  key={String(row.original.id || "")}
                  row={row.original as Record<string, string>}
                  headers={defaultHeaders}
                  onUpdate={handleUpdateRow}
                  onDelete={handleDeleteRow}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("table.status.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {filteredData.length} entries
          {entryCount > 0 && ` (${entryCount} with data)`}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Page</p>
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
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

