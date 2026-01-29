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
import { Search, Download, Eye, Plus, Edit, Power, PowerOff, Trash2, MoreHorizontal } from "lucide-react"
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
  useGetSystemAdminsQuery,
  useActivateSystemAdminMutation,
  useDeactivateSystemAdminMutation,
  useRemoveMasterAdminRoleMutation,
} from "@/store/api/system-admin/systemAdminApi"
import type { SystemAdmin } from "@/store/api/system-admin/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { CreateSystemAdminForm } from "./create-system-admin-form"
import { EditSystemAdminForm } from "./edit-system-admin-form"
import { format } from "date-fns"

export function SystemAdminDataTable() {
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading, refetch } = useGetSystemAdminsQuery()
  const [activateAdmin, { isLoading: isActivating }] = useActivateSystemAdminMutation()
  const [deactivateAdmin, { isLoading: isDeactivating }] = useDeactivateSystemAdminMutation()
  const [removeRole, { isLoading: isRemoving }] = useRemoveMasterAdminRoleMutation()
  const canCreateAdmin = isMasterAdmin(user)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<SystemAdmin | null>(null)

  const systemAdmins = data?.data || []

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
    refetch()
  }, [refetch])

  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedAdmin(null)
    refetch()
  }, [refetch])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedAdmin(null)
  }, [])

  const handleEdit = useCallback((admin: SystemAdmin) => {
    setSelectedAdmin(admin)
    setIsEditDialogOpen(true)
  }, [])

  const handleActivate = useCallback(async (admin: SystemAdmin) => {
    try {
      await activateAdmin(admin.id).unwrap()
      toast.success("System admin activated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate system admin"
      toast.error(errorMessage)
    }
  }, [activateAdmin, refetch])

  const handleDeactivate = useCallback(async (admin: SystemAdmin) => {
    try {
      await deactivateAdmin(admin.id).unwrap()
      toast.success("System admin deactivated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to deactivate system admin"
      toast.error(errorMessage)
    }
  }, [deactivateAdmin, refetch])

  const handleDeleteClick = useCallback((admin: SystemAdmin) => {
    setSelectedAdmin(admin)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedAdmin) return

    if (selectedAdmin.isProtected) {
      toast.error("Cannot delete protected system admin")
      setIsDeleteDialogOpen(false)
      setSelectedAdmin(null)
      return
    }

    try {
      await removeRole({ adminId: selectedAdmin.id }).unwrap()
      toast.success("System admin removed successfully")
      setIsDeleteDialogOpen(false)
      setSelectedAdmin(null)
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to remove system admin"
      toast.error(errorMessage)
    }
  }, [selectedAdmin, removeRole, refetch])

  const handleExportCsv = () => {
    if (systemAdmins.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Email", "First Name", "Last Name", "Status", "Protected", "Created At"]
    const rows = systemAdmins.map((admin: SystemAdmin) => [
      admin.email,
      admin.firstName || "",
      admin.lastName || "",
      admin.isActive ? "Active" : "Inactive",
      admin.isProtected ? "Yes" : "No",
      admin.createdAt ? format(new Date(admin.createdAt), "yyyy-MM-dd") : "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `system_admins_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    toast.info("PDF export coming soon")
  }

  const columns: ColumnDef<SystemAdmin>[] = useMemo(
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
          const admin = row.original
          const name = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || "—"
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
        accessorKey: "isProtected",
        header: "Protected",
        cell: ({ row }) => {
          const isProtected = row.original.isProtected
          return (
            <Badge variant={isProtected ? "default" : "outline"}>
              {isProtected ? "Yes" : "No"}
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
          const admin = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(admin)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {admin.isActive ? (
                  <DropdownMenuItem onClick={() => handleDeactivate(admin)}>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleActivate(admin)}>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                {!admin.isProtected && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(admin)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [handleEdit, handleActivate, handleDeactivate, handleDeleteClick]
  )

  const table = useReactTable({
    data: systemAdmins,
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
            placeholder="Search system admins..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {canCreateAdmin && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add System Admin
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
                  No system admins found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Create System Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create System Admin</DialogTitle>
            <DialogDescription>
              Add a new master admin user to the system. Only MasterAdmin can create system admins.
            </DialogDescription>
          </DialogHeader>
          <CreateSystemAdminForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit System Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit System Admin</DialogTitle>
            <DialogDescription>
              Update system admin information.
            </DialogDescription>
          </DialogHeader>
          {selectedAdmin && (
            <EditSystemAdminForm
              systemAdmin={selectedAdmin}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
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
              This will remove the master admin role from this user. This action cannot be undone.
              {selectedAdmin?.isProtected && (
                <span className="block mt-2 text-destructive font-semibold">
                  This admin is protected and cannot be deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedAdmin(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={selectedAdmin?.isProtected || isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
