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
import { Search, Download, Building2, MapPin, Plus, Edit, MoreVertical, CheckCircle, XCircle, Eye } from "lucide-react"
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
  useGetCentresQuery,
  useActivateCentreMutation,
  useSuspendCentreMutation,
} from "@/store/api/centres/centreApi"
import type { Centre } from "@/store/api/centres/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { exportTableToPdf } from "@/utils/pdfExport"
import { CreateCentreForm } from "./create-centre-form"
import { EditCentreForm } from "./edit-centre-form"

export function CentresDataTable() {
  const router = useRouter()
  const { data: centresData, isLoading: centresLoading, refetch } = useGetCentresQuery()
  const [activateCentre, { isLoading: isActivating }] = useActivateCentreMutation()
  const [suspendCentre, { isLoading: isSuspending }] = useSuspendCentreMutation()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null)

  const centres = centresData?.data || []

  const handleExportCsv = () => {
    if (centres.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Name", "Organisation", "Status"]
    const rows = centres.map((centre: Centre) => [
      centre.name,
      centre.organisation?.name ?? "Unknown",
      centre.status,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `centres_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    const headers = ["Name", "Organisation", "Status"]
    const rows = centres.map((centre: Centre) => [
      centre.name,
      centre.organisation?.name ?? "Unknown",
      centre.status,
    ])
    if (rows.length === 0) {
      toast.info("No data to export")
      return
    }
    exportTableToPdf({ title: "Centres", headers, rows })
    toast.success("PDF exported successfully")
  }

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
    refetch()
  }, [refetch])

  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedCentre(null)
    refetch()
  }, [refetch])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedCentre(null)
  }, [])

  const handleEdit = useCallback((centre: Centre) => {
    setSelectedCentre(centre)
    setIsEditDialogOpen(true)
  }, [])

  const handleActivate = useCallback(async (centre: Centre) => {
    try {
      await activateCentre(centre.id).unwrap()
      toast.success("Centre activated successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate centre"
      toast.error(errorMessage)
    }
  }, [activateCentre, refetch])

  const handleSuspend = useCallback(async (centre: Centre) => {
    try {
      await suspendCentre(centre.id).unwrap()
      toast.success("Centre suspended successfully")
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to suspend centre"
      toast.error(errorMessage)
    }
  }, [suspendCentre, refetch])

  const columns: ColumnDef<Centre>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return (
            <div className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {row.original.name}
            </div>
          )
        },
      },
      {
        accessorKey: "organisationId",
        header: "Organisation",
        cell: ({ row }) => {
          const org = row.original.organisation
          const orgName = org?.name ?? "Unknown"
          const orgId = row.original.organisationId ?? org?.id
          if (orgId == null) return <span className="text-muted-foreground">{orgName}</span>
          return (
            <Button
              variant="link"
              className="h-auto p-0 font-normal"
              onClick={() => router.push(`/organisations/${orgId}`)}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {orgName}
            </Button>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge variant={status === "active" ? "default" : "destructive"}>
              {status === "active" ? "Active" : "Disabled"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const centre = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/centres/${centre.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(centre)}
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
                  {centre.status === "suspended" ? (
                    <DropdownMenuItem
                      onClick={() => handleActivate(centre)}
                      disabled={isActivating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleSuspend(centre)}
                      disabled={isSuspending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [router, handleEdit, handleActivate, handleSuspend, isActivating, isSuspending]
  )

  const table = useReactTable({
    data: centres,
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

  if (centresLoading) {
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
            placeholder="Search centres..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Centre
          </Button>
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
                  No centres found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Create Centre Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Centre</DialogTitle>
            <DialogDescription>
              Add a new centre to an organisation.
            </DialogDescription>
          </DialogHeader>
          <CreateCentreForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Centre Dialog */}
      {selectedCentre && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Centre</DialogTitle>
              <DialogDescription>
                Update centre details.
              </DialogDescription>
            </DialogHeader>
            <EditCentreForm
              centre={selectedCentre}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
