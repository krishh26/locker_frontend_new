"use client"

import { useState, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Download, Plus, Edit, Power, PowerOff, Trash2, MoreHorizontal, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetAccountManagersQuery,
  useActivateAccountManagerMutation,
  useDeactivateAccountManagerMutation,
  useDeleteAccountManagerMutation,
} from "@/store/api/account-manager/accountManagerApi"
import type { AccountManager } from "@/store/api/account-manager/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { exportTableToPdf } from "@/utils/pdfExport"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { CreateAccountManagerForm } from "./create-account-manager-form"
import { EditAccountManagerForm } from "./edit-account-manager-form"
import { AssignOrganisationsDialog } from "./assign-organisations-dialog"
import { format } from "date-fns"

export function AccountManagerDataTable() {
  const t = useTranslations("accountManager")
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading, refetch } = useGetAccountManagersQuery()
  const [activateManager, { isLoading: isActivating }] = useActivateAccountManagerMutation()
  const [deactivateManager, { isLoading: isDeactivating }] = useDeactivateAccountManagerMutation()
  const [deleteManager, { isLoading: isDeleting }] = useDeleteAccountManagerMutation()
  const canCreateManager = isMasterAdmin(user)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState<AccountManager | null>(null)

  const accountManagers = data?.data || []

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
    refetch()
  }, [refetch])

  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedManager(null)
    refetch()
  }, [refetch])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedManager(null)
  }, [])

  const handleAssignSuccess = useCallback(() => {
    setIsAssignDialogOpen(false)
    setSelectedManager(null)
    refetch()
  }, [refetch])

  const handleAssignCancel = useCallback(() => {
    setIsAssignDialogOpen(false)
    setSelectedManager(null)
  }, [])

  const handleEdit = useCallback((manager: AccountManager) => {
    setSelectedManager(manager)
    setIsEditDialogOpen(true)
  }, [])

  const handleAssign = useCallback((manager: AccountManager) => {
    setSelectedManager(manager)
    setIsAssignDialogOpen(true)
  }, [])

  const handleActivate = useCallback(async (manager: AccountManager) => {
    try {
      await activateManager(manager.id).unwrap()
      toast.success(t("toast.activateSuccess"))
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toast.activateFailedFallback")
      toast.error(errorMessage)
    }
  }, [activateManager, refetch, t])

  const handleDeactivate = useCallback(async (manager: AccountManager) => {
    try {
      await deactivateManager(manager.id).unwrap()
      toast.success(t("toast.deactivateSuccess"))
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toast.deactivateFailedFallback")
      toast.error(errorMessage)
    }
  }, [deactivateManager, refetch, t])

  const handleDeleteClick = useCallback((manager: AccountManager) => {
    setSelectedManager(manager)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedManager) return
    try {
      await deleteManager(selectedManager.id).unwrap()
      toast.success(t("toast.deleteSuccess"))
      setIsDeleteDialogOpen(false)
      setSelectedManager(null)
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : t("toast.deleteFailedFallback")
      toast.error(errorMessage)
    }
  }, [selectedManager, deleteManager, refetch, t])

  const handleExportCsv = () => {
    if (accountManagers.length === 0) {
      toast.info(t("toast.noDataToExport"))
      return
    }

    const headers = [
      t("table.columns.email"),
      t("form.firstNameLabel"),
      t("form.lastNameLabel"),
      t("table.columns.status"),
      t("table.columns.assignedOrganisations"),
      t("table.columns.createdAt"),
    ]
    const rows = accountManagers.map((manager: AccountManager) => [
      manager.email,
      manager.firstName || "",
      manager.lastName || "",
      manager.isActive ? t("table.status.active") : t("table.status.inactive"),
      manager.assignedOrganisationIds.length.toString(),
      manager.createdAt ? format(new Date(manager.createdAt), "yyyy-MM-dd") : "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `account_managers_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t("toast.csvExported"))
  }

  const handleExportPdf = () => {
    const headers = [
      t("table.columns.email"),
      t("form.firstNameLabel"),
      t("form.lastNameLabel"),
      t("table.columns.status"),
      t("table.columns.assignedOrganisations"),
      t("table.columns.createdAt"),
    ]
    const rows = accountManagers.map((manager: AccountManager) => [
      manager.email,
      manager.firstName || "",
      manager.lastName || "",
      manager.isActive ? t("table.status.active") : t("table.status.inactive"),
      manager.assignedOrganisationIds.length.toString(),
      manager.createdAt ? format(new Date(manager.createdAt), "yyyy-MM-dd") : "",
    ])
    if (rows.length === 0) {
      toast.info(t("toast.noDataToExport"))
      return
    }
    exportTableToPdf({ title: t("page.title"), headers, rows })
    toast.success(t("toast.pdfExported"))
  }

  const columns: ColumnDef<AccountManager>[] = useMemo(
    () => [
      {
        accessorKey: "email",
        header: t("table.columns.email"),
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.email}</div>
        },
      },
      {
        id: "name",
        header: t("table.columns.name"),
        cell: ({ row }) => {
          const manager = row.original
          const name = [manager.firstName, manager.lastName].filter(Boolean).join(" ") || "—"
          return <div>{name}</div>
        },
      },
      {
        accessorKey: "isActive",
        header: t("table.columns.status"),
        cell: ({ row }) => {
          const isActive = row.original.isActive
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? t("table.status.active") : t("table.status.inactive")}
            </Badge>
          )
        },
      },
      {
        id: "assignedOrganisations",
        header: t("table.columns.assignedOrganisations"),
        cell: ({ row }) => {
          const count = row.original.assignedOrganisationIds.length
          return (
            <Badge variant="outline" className="cursor-pointer">
              {count === 1
                ? t("table.assignedOrgCount.one", { count })
                : t("table.assignedOrgCount.many", { count })}
            </Badge>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.columns.createdAt"),
        cell: ({ row }) => {
          const date = row.original.createdAt
          return date ? format(new Date(date), "MMM dd, yyyy") : "—"
        },
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => {
          const manager = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(manager)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAssign(manager)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {t("actions.assignOrganisations")}
                </DropdownMenuItem>
                {manager.isActive ? (
                  <DropdownMenuItem onClick={() => handleDeactivate(manager)}>
                    <PowerOff className="mr-2 h-4 w-4" />
                    {t("actions.deactivate")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleActivate(manager)}>
                    <Power className="mr-2 h-4 w-4" />
                    {t("actions.activate")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(manager)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleEdit, handleAssign, handleActivate, handleDeactivate, handleDeleteClick, t]
  )

  const table = useReactTable({
    data: accountManagers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

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
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("table.searchPlaceholder")}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {canCreateManager && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.add")}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t("actions.export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                {t("actions.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                {t("actions.exportPdf")}
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
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Create Account Manager Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.create.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.create.description")}
            </DialogDescription>
          </DialogHeader>
          <CreateAccountManagerForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Account Manager Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.edit.description")}
            </DialogDescription>
          </DialogHeader>
          {selectedManager && (
            <EditAccountManagerForm
              accountManager={selectedManager}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Organisations Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.assign.title")}</DialogTitle>
            <DialogDescription>
              {t("dialogs.assign.description")}
            </DialogDescription>
          </DialogHeader>
          {selectedManager && (
            <AssignOrganisationsDialog
              accountManager={selectedManager}
              onSuccess={handleAssignSuccess}
              onCancel={handleAssignCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedManager(null)
            }}>
              {t("dialogs.delete.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("dialogs.delete.deleting") : t("dialogs.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
