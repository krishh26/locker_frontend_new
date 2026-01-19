"use client";

import { useState, useMemo, useCallback } from "react";
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
  Plus,
  MoreHorizontal,
  Edit,
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
  useGetFundingBandsQuery,
} from "@/store/api/funding-band/fundingBandApi";
import type { FundingBand } from "@/store/api/funding-band/types";
import { FundingBandsFormDialog } from "./funding-bands-form-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";

export function FundingBandsDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState<{
    page: number;
    page_size: number;
    keyword?: string;
  }>({
    page: 1,
    page_size: 10,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFundingBand, setEditingFundingBand] = useState<FundingBand | null>(null);

  const { data, isLoading, refetch } = useGetFundingBandsQuery(filters);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: globalFilter || undefined,
    }));
  }, [globalFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setGlobalFilter("");
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: undefined,
    }));
  };

  const handleAddNew = () => {
    setEditingFundingBand(null);
    setIsFormOpen(true);
  };

  const handleEdit = (fundingBand: FundingBand) => {
    setEditingFundingBand(fundingBand);
    setIsFormOpen(true);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = ["Course Name", "Level", "Amount (£)"];
    const rows = data.data.map((band) => [
      band.course.course_name,
      band.course.level || "",
      band.amount.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `funding_bands_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportPdf = () => {
    toast.info("PDF export functionality will be implemented");
  };

  const columns: ColumnDef<FundingBand>[] = useMemo(
    () => [
      {
        accessorKey: "course.course_name",
        header: "Course Name",
        cell: ({ row }) => {
          return row.original.course.course_name;
        },
      },
      {
        accessorKey: "course.level",
        header: "Level",
        cell: ({ row }) => {
          return row.original.course.level || "-";
        },
      },
      {
        accessorKey: "amount",
        header: "Amount (£)",
        cell: ({ row }) => {
          return (
            <span className="font-semibold">
              £{row.original.amount.toLocaleString()}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const fundingBand = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(fundingBand)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.data || [],
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
    manualPagination: true,
    pageCount: data?.meta_data?.pages || 0,
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
              placeholder="Search by keyword..."
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
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleAddNew} className="cursor-pointer">
            <Plus className="mr-2 size-4" />
            Add New
          </Button>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta_data && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={data.meta_data.page}
          totalPages={data.meta_data.pages}
          totalItems={data.meta_data.items}
          pageSize={data.meta_data.page_size}
          onPageChange={handlePageChange}
          onPageSizeChange={(newPageSize) => {
            setFilters((prev) => ({
              ...prev,
              page: 1,
              page_size: newPageSize,
            }));
          }}
        />
      )}

      {/* Form Dialog */}
      <FundingBandsFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        fundingBand={editingFundingBand}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingFundingBand(null);
          refetch();
        }}
      />
    </div>
  );
}

