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
  Trash2,
  Radio,
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
import {
  useGetBroadcastsQuery,
  useDeleteBroadcastMutation,
} from "@/store/api/broadcast/broadcastApi";
import type { Broadcast, BroadcastFilters } from "@/store/api/broadcast/types";
import { BroadcastFormDialog } from "./broadcast-form-dialog";
import { BroadcastMessageDialog } from "./broadcast-message-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";

export function BroadcastDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [filters, setFilters] = useState<BroadcastFilters>({
    page: 1,
    page_size: 10,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<Broadcast | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [broadcastToSend, setBroadcastToSend] = useState<Broadcast | null>(null);

  const { data, isLoading, refetch } = useGetBroadcastsQuery(filters);
  const [deleteBroadcast, { isLoading: isDeleting }] = useDeleteBroadcastMutation();

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
    setEditingBroadcast(null);
    setIsFormOpen(true);
  };

  const handleEdit = (broadcast: Broadcast) => {
    setEditingBroadcast(broadcast);
    setIsFormOpen(true);
  };

  const handleBroadcast = (broadcast: Broadcast) => {
    setBroadcastToSend(broadcast);
    setIsMessageDialogOpen(true);
  };

  const handleDeleteClick = (broadcast: Broadcast) => {
    setBroadcastToDelete(broadcast);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!broadcastToDelete) return;

    try {
      await deleteBroadcast(broadcastToDelete.id).unwrap();
      toast.success("Broadcast deleted successfully");
      setDeleteDialogOpen(false);
      setBroadcastToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to delete broadcast");
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = ["Title", "Description", "Email", "User Name", "Date"];
    const rows = data.data.map((broadcast) => [
      broadcast.title,
      broadcast.description,
      broadcast.user_id?.email || "",
      broadcast.user_id?.user_name || "",
      formatDate(broadcast.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `broadcasts_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportPdf = () => {
    toast.info("PDF export functionality will be implemented");
  };

  const columns: ColumnDef<Broadcast>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const title = row.original.title;
          return (
            <div className="max-w-[200px] truncate" title={title}>
              {title}
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.original.description;
          return (
            <div className="max-w-[300px] truncate" title={description}>
              {description}
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          return row.original.user_id?.email || "-";
        },
      },
      {
        accessorKey: "user_name",
        header: "User Name",
        cell: ({ row }) => {
          return row.original.user_id?.user_name || "-";
        },
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => {
          return formatDate(row.original.created_at);
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const broadcast = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBroadcast(broadcast)}>
                  <Radio className="mr-2 h-4 w-4" />
                  Broadcast
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(broadcast)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(broadcast)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
      <BroadcastFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        broadcast={editingBroadcast}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingBroadcast(null);
          refetch();
        }}
      />

      {/* Broadcast Message Dialog */}
      <BroadcastMessageDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
        broadcast={broadcastToSend}
        onSuccess={() => {
          setIsMessageDialogOpen(false);
          setBroadcastToSend(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the broadcast{" "}
              <strong>{broadcastToDelete?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

