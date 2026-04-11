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
import { useTranslations } from "next-intl";
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
import { formatWellbeingDisplayName } from "@/lib/wellbeing-resource-display";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { WellbeingResourceFormDialog } from "./wellbeing-resource-form-dialog";

export function WellbeingResourcesDataTable() {
  const t = useTranslations("wellbeing");
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
      toast.error(t("toast.loadFailed"));
    }
  }, [error, t]);

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
          resource.isActive ? t("toast.deactivatedSuccess") : t("toast.activatedSuccess")
        );
        refetch();
      } catch {
        toast.error(
          resource.isActive ? t("toast.deactivateFailed") : t("toast.activateFailed")
        );
      }
    },
    [toggleResource, refetch, t]
  );

  const handleDeleteClick = (resource: WellbeingResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!resourceToDelete) return;

    try {
      await deleteResource(resourceToDelete.id).unwrap();
      toast.success(t("toast.deletedSuccess"));
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
      refetch();
    } catch {
      toast.error(t("toast.deleteFailed"));
    }
  }, [resourceToDelete, deleteResource, refetch, t]);

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
      toast.warning(t("toast.noDataToExport"));
      return;
    }

    const resourcesWithFeedbacks = resourcesData.data.filter(
      (resource) => resource.feedback
    );

    if (resourcesWithFeedbacks.length === 0) {
      toast.info(t("toast.noFeedbackToExport"));
      return;
    }

    const headers = [
      t("export.headers.resourceName"),
      t("export.headers.feedback"),
      t("export.headers.createdAt"),
    ];
    const rows = resourcesWithFeedbacks.map((resource) => [
      formatWellbeingDisplayName(resource),
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
      `${t("export.filenamePrefix")}-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("toast.exportSuccess"));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return t("table.invalidDate");
    }
  };

  const columns = useMemo<ColumnDef<WellbeingResource>[]>(
    () => [
      {
        id: "resource_name",
        accessorFn: (row) => formatWellbeingDisplayName(row),
        header: t("table.columns.name"),
        cell: ({ row }) => {
          const resource = row.original;
          const title = resource.location || resource.resource_name || undefined;
          return (
            <div className="flex flex-col">
              <span
                className="font-medium line-clamp-2 max-w-md"
                title={title}
              >
                {formatWellbeingDisplayName(resource)}
              </span>
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
        header: t("table.columns.status"),
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
                    ? "bg-accent text-white hover:bg-accent"
                    : "bg-muted text-muted-foreground"
                }
              >
                {resource.isActive ? t("table.status.active") : t("table.status.inactive")}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.columns.createdAt"),
        cell: ({ row }) => {
          return formatDate(row.original.createdAt);
        },
      },
      {
        accessorKey: "createdByName",
        header: t("table.columns.createdBy"),
        cell: ({ row }) => {
          return row.original.createdByName || "-";
        },
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => {
          const resource = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("table.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditClick(resource)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("table.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(resource)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("table.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleToggleActive, isToggling, t]
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
            placeholder={t("table.searchPlaceholder")}
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
            {t("table.exportFeedbacks")}
          </Button>
          <Button
            onClick={handleAddClick}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("table.addResource")}
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
                  {t("table.noResourcesFound")}
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
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", {
                name: resourceToDelete
                  ? formatWellbeingDisplayName(resourceToDelete)
                  : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={isDeleting}>
              {t("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

