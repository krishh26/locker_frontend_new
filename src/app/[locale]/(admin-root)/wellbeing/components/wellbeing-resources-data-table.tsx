"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useGetAdminResourcesQuery,
  useToggleResourceMutation,
  useDeleteResourceMutation,
} from "@/store/api/health-wellbeing/healthWellbeingApi";
import type { WellbeingResource } from "@/store/api/health-wellbeing/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { WellbeingResourceFormDialog } from "./wellbeing-resource-form-dialog";

export function WellbeingResourcesDataTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<WellbeingResource | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<WellbeingResource | null>(null);

  const {
    data: resourcesData,
    isLoading,
    error,
    refetch,
  } = useGetAdminResourcesQuery(
    {
      search: searchKeyword || undefined,
      page,
      limit: pageSize,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to load wellbeing resources. Please try again.");
    }
  }, [error]);

  const [toggleResource, { isLoading: isToggling }] = useToggleResourceMutation();
  const [deleteResource, { isLoading: isDeleting }] = useDeleteResourceMutation();

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleToggleActive = useCallback(
    async (resource: WellbeingResource) => {
      try {
        await toggleResource({
          id: resource.id,
          isActive: !resource.isActive,
        }).unwrap();
        toast.success(
          `Resource ${resource.isActive ? "deactivated" : "activated"} successfully`
        );
        refetch();
      } catch {
        toast.error(
          `Failed to ${resource.isActive ? "deactivate" : "activate"} resource`
        );
      }
    },
    [toggleResource, refetch]
  );

  const handleDeleteClick = (resource: WellbeingResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!resourceToDelete) return;

    try {
      await deleteResource(resourceToDelete.id).unwrap();
      toast.success("Resource deleted successfully");
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      refetch();
    } catch {
      toast.error("Failed to delete resource");
    }
  }, [resourceToDelete, deleteResource, refetch]);

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setResourceToDelete(null);
  };

  const handleAddClick = () => {
    setEditingResource(null);
    setFormDialogOpen(true);
  };

  const handleEditClick = (resource: WellbeingResource) => {
    setEditingResource(resource);
    setFormDialogOpen(true);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const handleExportFeedbacks = () => {
    if (!resourcesData?.data) {
      toast.warning("No data available to export");
      return;
    }

    const resourcesWithFeedbacks = resourcesData.data.filter(
      (resource) => resource.feedback
    );

    if (resourcesWithFeedbacks.length === 0) {
      toast.info("No feedback data available to export");
      return;
    }

    const headers = ["Resource Name", "Feedback", "Created At"];
    const rows = resourcesWithFeedbacks.map((resource) => [
      resource.resource_name,
      resource.feedback?.feedback || "",
      resource.feedback?.createdAt ? format(new Date(resource.feedback.createdAt), "MMM dd, yyyy") : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `wellbeing-feedbacks-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Feedback report exported successfully");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  const columns = useMemo<ColumnDef<WellbeingResource>[]>(
    () => [
      {
        accessorKey: "resource_name",
        header: "Name",
        cell: ({ row }) => {
          const resource = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{resource.resource_name}</span>
              {resource.description && (
                <span className="text-sm text-muted-foreground truncate max-w-md">
                  {resource.description}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const resource = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={resource.isActive ?? false}
                onCheckedChange={() => handleToggleActive(resource)}
                disabled={isToggling}
              />
              <Badge
                variant={resource.isActive ? "default" : "secondary"}
                className={
                  resource.isActive
                    ? "bg-accent/10 text-accent hover:bg-accent/10"
                    : "bg-muted text-muted-foreground"
                }
              >
                {resource.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
          return formatDate(row.original.createdAt);
        },
      },
      {
        accessorKey: "createdByName",
        header: "Created By",
        cell: ({ row }) => {
          return row.original.createdByName || "-";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const resource = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditClick(resource)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(resource)}
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
    [handleToggleActive, isToggling]
  );

  const table = useReactTable({
    data: resourcesData?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: Math.ceil((resourcesData?.total || 0) / pageSize),
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

  const totalPages = Math.ceil((resourcesData?.total || 0) / pageSize);

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources by name..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportFeedbacks}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Feedbacks
          </Button>
          <Button
            onClick={handleAddClick}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={page}
          totalPages={totalPages}
          totalItems={resourcesData?.total || 0}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Form Dialog */}
      <WellbeingResourceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        resource={editingResource}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{resourceToDelete?.resource_name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
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

