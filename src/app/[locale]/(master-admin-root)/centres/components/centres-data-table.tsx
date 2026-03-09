"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { clearMasterAdminOrganisationId } from "@/store/slices/orgContextSlice"
import { isMasterAdmin, type UserWithOrganisations } from "@/utils/permissions"
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { Centre } from "@/store/api/centres/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { exportTableToPdf } from "@/utils/pdfExport"
import { CreateCentreForm } from "./create-centre-form"
import { EditCentreForm } from "./edit-centre-form"

const DEFAULT_PAGE_SIZE = 10

export function CentresDataTable() {
  const t = useTranslations("centres.dataTable")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null)

  // Clear global org context on this page so list uses only query param (avoids stale header when changing org filter)
  useEffect(() => {
    if (isMasterAdmin(user as unknown as UserWithOrganisations | null)) {
      dispatch(clearMasterAdminOrganisationId())
    }
  }, [user, dispatch])

  const queryArgs = useMemo(
    () => ({
      page,
      limit: pageSize,
      organisationId: orgFilter !== "all" ? Number(orgFilter) : undefined,
      status: statusFilter === "all" ? undefined : (statusFilter as "active" | "suspended"),
      meta: true,
    }),
    [page, pageSize, statusFilter, orgFilter]
  )
  const { data: centresData, isLoading: centresLoading, refetch } = useGetCentresQuery(queryArgs)
  const { data: organisationsData } = useGetOrganisationsQuery()

  const [activateCentre, { isLoading: isActivating }] = useActivateCentreMutation()
  const [suspendCentre, { isLoading: isSuspending }] = useSuspendCentreMutation()

  const centres = centresData?.data ?? []
  const meta = centresData?.meta_data
  const totalItems = meta?.items ?? 0
  const totalPages = meta?.pages ?? 0

  const handleExportCsv = () => {
    if (centres.length === 0) {
      toast.info(t("noDataToExport"))
      return
    }

    const headers = [t("name"), t("organisation"), t("status")]
    const rows = centres.map((centre: Centre) => [
      centre.name,
      centre.organisation?.name ?? t("unknown"),
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
    toast.success(t("csvExported"))
  }

  const handleExportPdf = () => {
    const headers = [t("name"), t("organisation"), t("status")]
    const rows = centres.map((centre: Centre) => [
      centre.name,
      centre.organisation?.name ?? t("unknown"),
      centre.status,
    ])
    if (rows.length === 0) {
      toast.info(t("noDataToExport"))
      return
    }
    exportTableToPdf({ title: t("pdfTitle"), headers, rows })
    toast.success(t("pdfExported"))
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
      toast.success(t("toastActivated"))
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastActivateFailed")
      toast.error(errorMessage)
    }
  }, [activateCentre, refetch, t])

  const handleSuspend = useCallback(async (centre: Centre) => {
    try {
      await suspendCentre(centre.id).unwrap()
      toast.success(t("toastSuspended"))
      refetch()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastSuspendFailed")
      toast.error(errorMessage)
    }
  }, [suspendCentre, refetch, t])

  const columns: ColumnDef<Centre>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("name"),
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
        header: t("organisation"),
        cell: ({ row }) => {
          const org = row.original.organisation
          const orgName = org?.name ?? t("unknown")
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
        header: t("status"),
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge variant={status === "active" ? "default" : "destructive"}>
              {status === "active" ? t("active") : t("disabled")}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: t("actions"),
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
                {t("view")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(centre)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("edit")}
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
                      {t("activate")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleSuspend(centre)}
                      disabled={isSuspending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {t("suspend")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [router, handleEdit, handleActivate, handleSuspend, isActivating, isSuspending, t]
  )

  const table = useReactTable({
    data: centres,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value)
    setPage(1)
  }, [])

  const handleOrgFilterChange = useCallback((value: string) => {
    setOrgFilter(value)
    setPage(1)
  }, [])

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
      {/* Search, filters and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="active">{t("active")}</SelectItem>
              <SelectItem value="suspended">{t("suspended")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={orgFilter} onValueChange={handleOrgFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("filterByOrganisation")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allOrganisations")}</SelectItem>
              {(organisationsData?.data ?? []).map((org: { id: number; name: string }) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addCentre")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                {t("export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv}>
                {t("exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                {t("exportPdf")}
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
                  {t("noCentresFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        table={table}
        manualPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Create Centre Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>
              {t("createDescription")}
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
              <DialogTitle>{t("editTitle")}</DialogTitle>
              <DialogDescription>
                {t("editDescription")}
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
