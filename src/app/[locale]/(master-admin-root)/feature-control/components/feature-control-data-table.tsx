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
import { Search, Download, Plus, Edit, MoreHorizontal, Link2, Trash2 } from "lucide-react"
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
import { useGetFeaturesQuery } from "@/store/api/feature-control/featureControlApi"
import type { Feature } from "@/store/api/feature-control/types"
import { FeatureType } from "@/store/api/feature-control/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { exportTableToPdf } from "@/utils/pdfExport"
import { CreateFeatureForm } from "./create-feature-form"
import { EditFeatureForm } from "./edit-feature-form"
import { MapFeatureToPlanDialog } from "./map-feature-to-plan-dialog"
import { ViewMappedPlansDialog } from "./view-mapped-plans-dialog"

export function FeatureControlDataTable() {
  const user = useAppSelector(selectAuthUser)
  const { data, isLoading, refetch } = useGetFeaturesQuery()
  const canCreateFeature = isMasterAdmin(user)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [isViewMappedDialogOpen, setIsViewMappedDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [selectedFeatureForView, setSelectedFeatureForView] =
    useState<Feature | null>(null)

  const features = data?.data || []

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
    refetch()
  }, [refetch])

  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedFeature(null)
    refetch()
  }, [refetch])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedFeature(null)
  }, [])

  const handleMapSuccess = useCallback(() => {
    setIsMapDialogOpen(false)
    setSelectedFeature(null)
    refetch()
  }, [refetch])

  const handleMapCancel = useCallback(() => {
    setIsMapDialogOpen(false)
    setSelectedFeature(null)
  }, [])

  const handleEdit = useCallback((feature: Feature) => {
    setSelectedFeature(feature)
    setIsEditDialogOpen(true)
  }, [])

  const handleMap = useCallback((feature: Feature) => {
    setSelectedFeature(feature)
    setIsMapDialogOpen(true)
  }, [])

  const handleViewMappedPlans = useCallback((feature: Feature) => {
    setSelectedFeatureForView(feature)
    setIsViewMappedDialogOpen(true)
  }, [])

  const handleViewMappedDialogClose = useCallback(() => {
    setIsViewMappedDialogOpen(false)
    setSelectedFeatureForView(null)
  }, [])

  const handleViewMappedThenMap = useCallback(() => {
    if (!selectedFeatureForView) return
    setSelectedFeature(selectedFeatureForView)
    setIsViewMappedDialogOpen(false)
    setSelectedFeatureForView(null)
    setIsMapDialogOpen(true)
  }, [selectedFeatureForView])

  const handleDeleteClick = useCallback((feature: Feature) => {
    setSelectedFeature(feature)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedFeature) return
    toast.info("Delete functionality to be implemented")
    setIsDeleteDialogOpen(false)
    setSelectedFeature(null)
  }, [selectedFeature])

  const handleExportCsv = () => {
    if (features.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Name", "Code", "Description", "Status", "Limits"]
    const rows = features.map((feature: Feature) => {
      const limits = feature.limits
        ? Object.entries(feature.limits)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}:${v}`)
            .join("; ")
        : "None"
      return [
        feature.name,
        feature.code,
        feature.description || "",
        feature.isActive ? "Active" : "Inactive",
        limits,
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `features_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    if (features.length === 0) {
      toast.info("No data to export")
      return
    }
    const headers = ["Name", "Code", "Description", "Status", "Limits"]
    const rows = features.map((feature: Feature) => {
      const limits = feature.limits
        ? Object.entries(feature.limits)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => `${k}:${v}`)
            .join("; ")
        : "None"
      return [
        feature.name,
        feature.code,
        feature.description || "",
        feature.isActive ? "Active" : "Inactive",
        limits,
      ]
    })
    exportTableToPdf({ title: "Features", headers, rows })
    toast.success("PDF exported successfully")
  }

  const formatLimits = (limits?: Feature["limits"]) => {
    if (!limits) return "—"
    const parts: string[] = []
    if (limits.maxUsers) parts.push(`Users: ${limits.maxUsers}`)
    if (limits.maxCentres) parts.push(`Centres: ${limits.maxCentres}`)
    if (limits.maxOrganisations) parts.push(`Orgs: ${limits.maxOrganisations}`)
    return parts.length > 0 ? parts.join(", ") : "—"
  }

  const columns: ColumnDef<Feature>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>
        },
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => {
          return <code className="text-sm bg-muted px-2 py-1 rounded">{row.original.code}</code>
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type
          if (!type) return <span className="text-muted-foreground">—</span>
          const typeLabels: Record<FeatureType, string> = {
            [FeatureType.Limit]: "Limit",
            [FeatureType.Toggle]: "Toggle",
            [FeatureType.Usage]: "Usage",
          }
          return (
            <Badge variant="outline">
              {typeLabels[type] || type}
            </Badge>
          )
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const desc = row.original.description
          return (
            <div className="max-w-[300px] truncate" title={desc}>
              {desc || "—"}
            </div>
          )
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
        id: "limits",
        header: "Limits",
        cell: ({ row }) => {
          return (
            <div className="text-sm text-muted-foreground max-w-[200px]">
              {formatLimits(row.original.limits)}
            </div>
          )
        },
      },
      {
        id: "mappedPlans",
        header: "Mapped Plans",
        cell: ({ row }) => {
          return (
            <Badge
              variant="outline"
              className="cursor-pointer"
              role="button"
              onClick={() => handleViewMappedPlans(row.original)}
            >
              View
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const feature = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(feature)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Limits
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMap(feature)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Map to Plan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(feature)}
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
    [handleEdit, handleMap, handleViewMappedPlans, handleDeleteClick]
  )

  const table = useReactTable({
    data: features,
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
            placeholder="Search features..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {canCreateFeature && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Feature
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
                  No features found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Create Feature Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Feature</DialogTitle>
            <DialogDescription>
              Add a new feature to the system. Only MasterAdmin can create features.
            </DialogDescription>
          </DialogHeader>
          <CreateFeatureForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Feature Limits</DialogTitle>
            <DialogDescription>
              Update feature limits and constraints.
            </DialogDescription>
          </DialogHeader>
          {selectedFeature && (
            <EditFeatureForm
              feature={selectedFeature}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Map Feature to Plan Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Map Feature to Plan</DialogTitle>
            <DialogDescription>
              Map this feature to a subscription plan and control its availability.
            </DialogDescription>
          </DialogHeader>
          {selectedFeature && (
            <MapFeatureToPlanDialog
              feature={selectedFeature}
              onSuccess={handleMapSuccess}
              onCancel={handleMapCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Mapped Plans Dialog */}
      <Dialog
        open={isViewMappedDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleViewMappedDialogClose()
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mapped Plans</DialogTitle>
            <DialogDescription>
              Plans this feature is mapped to. Use Map to Plan to add or change mappings.
            </DialogDescription>
          </DialogHeader>
          {selectedFeatureForView && (
            <ViewMappedPlansDialog
              feature={selectedFeatureForView}
              onClose={handleViewMappedDialogClose}
              onMapToPlan={handleViewMappedThenMap}
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
              This will permanently delete this feature. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false)
              setSelectedFeature(null)
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
