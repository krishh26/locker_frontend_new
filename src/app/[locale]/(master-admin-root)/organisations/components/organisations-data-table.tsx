"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
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
import { Search, Download, Eye, Plus, Edit, MoreVertical, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { DataTablePagination } from "@/components/data-table-pagination"
import {
  useGetOrganisationsQuery,
  useUpdateOrganisationMutation,
  useActivateOrganisationMutation,
  useSuspendOrganisationMutation,
} from "@/store/api/organisations/organisationApi"
import type { Organisation } from "@/store/api/organisations/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { CreateOrganisationForm } from "./create-organisation-form"
import { EditOrganisationForm } from "./edit-organisation-form"

export function OrganisationsDataTable() {
  const router = useRouter()
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading, refetch } = useGetOrganisationsQuery()
  const [updateOrganisation] = useUpdateOrganisationMutation()
  const [activateOrganisation, { isLoading: isActivating }] = useActivateOrganisationMutation()
  const [suspendOrganisation, { isLoading: isSuspending }] = useSuspendOrganisationMutation()
  const canCreateOrganisation = isMasterAdmin(user)
  const canEditOrganisation = isMasterAdmin(user)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null)

  const organisations = data?.data || []

  // Stable callback for form success
  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
    refetch()
  }, [refetch])

  // Stable callback for form cancel
  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  // Stable callback for edit form success
  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedOrganisation(null)
    refetch()
  }, [refetch])

  // Stable callback for edit form cancel
  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedOrganisation(null)
  }, [])

  const handleEdit = useCallback((org: Organisation) => {
    setSelectedOrganisation(org)
    setIsEditDialogOpen(true)
  }, [])

  const handleActivate = useCallback(async (org: Organisation) => {
    try {
      await activateOrganisation(org.id).unwrap()
      toast.success("Organisation activated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate organisation"
      toast.error(errorMessage)
    }
  }, [activateOrganisation, refetch])

  const handleSuspend = useCallback(async (org: Organisation) => {
    try {
      await suspendOrganisation(org.id).unwrap()
      toast.success("Organisation suspended successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to suspend organisation"
      toast.error(errorMessage)
    }
  }, [suspendOrganisation, refetch])

  const handleExportCsv = () => {
    if (organisations.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Name", "Status"]
    const rows = organisations.map((org: Organisation) => [
      org.name,
      org.status,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `organisations_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    toast.info("PDF export coming soon")
  }

  const columns: ColumnDef<Organisation>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              variant={status === "active" ? "default" : "destructive"}
            >
              {status === "active" ? "Active" : "Suspended"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const org = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/organisations/${org.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              {canEditOrganisation && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(org)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isActivating || isSuspending}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {org.status === "suspended" ? (
                        <DropdownMenuItem
                          onClick={() => handleActivate(org)}
                          disabled={isActivating}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleSuspend(org)}
                          disabled={isSuspending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [router, canEditOrganisation, handleEdit, handleActivate, handleSuspend, isActivating, isSuspending]
  )

  const table = useReactTable({
    data: organisations,
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
            placeholder="Search organisations..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {canCreateOrganisation && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Organisation
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
                  No organisations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Create Organisation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Organisation</DialogTitle>
            <DialogDescription>
              Add a new organisation to the system. Only MasterAdmin can create organisations.
            </DialogDescription>
          </DialogHeader>
          <CreateOrganisationForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Organisation Dialog */}
      {selectedOrganisation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Organisation</DialogTitle>
              <DialogDescription>
                Update organisation details. Only MasterAdmin can edit organisations.
              </DialogDescription>
            </DialogHeader>
            <EditOrganisationForm
              organisation={selectedOrganisation}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
