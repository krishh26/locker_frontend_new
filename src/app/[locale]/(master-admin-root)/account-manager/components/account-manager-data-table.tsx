"use client"

import { useState, useMemo, useCallback } from "react"
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
} from "@/store/api/account-manager/accountManagerApi"
import type { AccountManager } from "@/store/api/account-manager/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { CreateAccountManagerForm } from "./create-account-manager-form"
import { EditAccountManagerForm } from "./edit-account-manager-form"
import { AssignOrganisationsDialog } from "./assign-organisations-dialog"
import { format } from "date-fns"

export function AccountManagerDataTable() {
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading, refetch } = useGetAccountManagersQuery()
  const [activateManager, { isLoading: isActivating }] = useActivateAccountManagerMutation()
  const [deactivateManager, { isLoading: isDeactivating }] = useDeactivateAccountManagerMutation()
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
      toast.success("Account manager activated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate account manager"
      toast.error(errorMessage)
    }
  }, [activateManager, refetch])

  const handleDeactivate = useCallback(async (manager: AccountManager) => {
    try {
      await deactivateManager(manager.id).unwrap()
      toast.success("Account manager deactivated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to deactivate account manager"
      toast.error(errorMessage)
    }
  }, [deactivateManager, refetch])

  const handleDeleteClick = useCallback((manager: AccountManager) => {
    setSelectedManager(manager)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedManager) return
    toast.info("Delete functionality to be implemented")
    setIsDeleteDialogOpen(false)
    setSelectedManager(null)
  }, [selectedManager])

  const handleExportCsv = () => {
    if (accountManagers.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Email", "First Name", "Last Name", "Status", "Assigned Organisations", "Created At"]
    const rows = accountManagers.map((manager: AccountManager) => [
      manager.email,
      manager.firstName || "",
      manager.lastName || "",
      manager.isActive ? "Active" : "Inactive",
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
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    toast.info("PDF export coming soon")
  }

  const columns: ColumnDef<AccountManager>[] = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.email}</div>
        },
      },
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const manager = row.original
          const name = [manager.firstName, manager.lastName].filter(Boolean).join(" ") || "—"
          return <div>{name}</div>
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.original.isActive
          return (
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        id: "assignedOrganisations",
        header: "Assigned Organisations",
        cell: ({ row }) => {
          const count = row.original.assignedOrganisationIds.length
          return (
            <Badge variant="outline" className="cursor-pointer">
              {count} {count === 1 ? "organisation" : "organisations"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
          const date = row.original.createdAt
          return date ? format(new Date(date), "MMM dd, yyyy") : "—"
        },
      },
      {
        id: "actions",
        header: "Actions",
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
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAssign(manager)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Assign Organisations
                </DropdownMenuItem>
                {manager.isActive ? (
                  <DropdownMenuItem onClick={() => handleDeactivate(manager)}>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleActivate(manager)}>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(manager)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleEdit, handleAssign, handleActivate, handleDeactivate, handleDeleteClick]
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
            placeholder="Search account managers..."
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
              Add Account Manager
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                Export PDF
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
                  No account managers found.
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
            <DialogTitle>Create Account Manager</DialogTitle>
            <DialogDescription>
              Add a new account manager user to the system. Only MasterAdmin can create account managers.
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
            <DialogTitle>Edit Account Manager</DialogTitle>
            <DialogDescription>
              Update account manager information.
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
            <DialogTitle>Assign Organisations</DialogTitle>
            <DialogDescription>
              Select which organisations this account manager can access.
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account manager. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedManager(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
