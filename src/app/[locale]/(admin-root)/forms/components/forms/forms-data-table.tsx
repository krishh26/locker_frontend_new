"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
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
  Eye,
  Users,
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
import { format } from "date-fns";
import {
  useGetFormsListQuery,
  useDeleteFormMutation,
} from "@/store/api/forms/formsApi";
import type { FormListItem } from "@/store/api/forms/types";
import { AssignUsersDialog } from "./assign-users-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useAppSelector } from "@/store/hooks";

export function FormsDataTable() {
  const t = useTranslations("forms");
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isEmployer = userRole === "Employer";
  
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<FormListItem | null>(null);
  const [assignUsersOpen, setAssignUsersOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormListItem | null>(null);

  const { data, isLoading, refetch } = useGetFormsListQuery(filters);
  const [deleteForm, { isLoading: isDeleting }] = useDeleteFormMutation();

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
    router.push("/forms/new/builder");
  };


  const handleDeleteClick = (form: FormListItem) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formToDelete) return;

    try {
      await deleteForm({ formId: formToDelete.id }).unwrap();
      toast.success(t("table.toastDeleteSuccess"));
      setDeleteDialogOpen(false);
      setFormToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || t("table.toastDeleteFailed"));
    }
  };

  const handleAssignUsers = (form: FormListItem) => {
    setSelectedForm(form);
    setAssignUsersOpen(true);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info(t("table.toastNoData"));
      return;
    }

    const headers = [t("table.formName"), t("table.description"), t("table.type"), t("table.createdAt")];
    const rows = data.data.map((form) => [
      form.form_name,
      form.description || "",
      form.type,
      form.created_at ? format(new Date(form.created_at), "yyyy-MM-dd") : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `forms_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("table.toastCsvSuccess"));
  };

  const handleExportPdf = () => {
    toast.info(t("table.toastPdfInfo"));
  };

  const handleEdit = useCallback((form: FormListItem) => {
    router.push(`/forms/${form.id}/builder`);
  }, [router]);

  const handleView = useCallback((form: FormListItem) => {
    router.push(`/forms/${form.id}/view`);
  }, [router]);

  const columns: ColumnDef<FormListItem>[] = useMemo(
    () => [
      {
        accessorKey: "form_name",
        header: t("table.formName"),
      },
      {
        accessorKey: "description",
        header: t("table.description"),
        cell: ({ row }) => {
          return row.original.description || "-";
        },
      },
      {
        accessorKey: "type",
        header: t("table.type"),
      },
      {
        accessorKey: "created_at",
        header: t("table.createdAt"),
        cell: ({ row }) => {
          return row.original.created_at
            ? format(new Date(row.original.created_at), "MMM dd, yyyy")
            : "-";
        },
      },
      {
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => {
          const form = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("table.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleView(form)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("table.view")}
                </DropdownMenuItem>
                {!isEmployer && (
                  <>
                    <DropdownMenuItem onClick={() => handleEdit(form)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("table.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAssignUsers(form)}>
                      <Users className="mr-2 h-4 w-4" />
                      {t("table.assignUsers")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(form)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("table.delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEdit, handleView, isEmployer, t]
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
              placeholder={t("table.searchPlaceholder")}
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
              {t("table.clear")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          {!isEmployer && (
            <Button onClick={handleAddNew} className="cursor-pointer">
              <Plus className="mr-2 size-4" />
              {t("table.addNewForm")}
            </Button>
          )}
        </div>
      </div>

      {/* Templates Section */}
      {/* <TemplatesSection /> */}

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
                  {t("table.noResults")}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: formToDelete?.form_name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("deleteDialog.cancel")}</AlertDialogCancel>
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

      {/* Assign Users Dialog */}
      {selectedForm && (
        <AssignUsersDialog
          open={assignUsersOpen}
          onOpenChange={setAssignUsersOpen}
          formId={selectedForm.id}
          formName={selectedForm.form_name}
          onSuccess={() => {
            setAssignUsersOpen(false);
            setSelectedForm(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

