"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
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
  useActivateOrganisationMutation,
  useSuspendOrganisationMutation,
} from "@/store/api/organisations/organisationApi"
import { exportTableToPdf } from "@/utils/pdfExport"
import type { Organisation } from "@/store/api/organisations/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin, type UserWithOrganisations } from "@/utils/permissions"
import { CreateOrganisationForm } from "./create-organisation-form"
import { EditOrganisationForm } from "./edit-organisation-form"

const DEFAULT_PAGE_SIZE = 10

export function OrganisationsDataTable() {
  const t = useTranslations("organisations.dataTable")
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const user = useAppSelector(selectAuthUser)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null)

  const queryArgs = useMemo(
    () => ({ page, limit: pageSize }),
    [page, pageSize]
  )
  const { data, isLoading } = useGetOrganisationsQuery(queryArgs)
  const [activateOrganisation, { isLoading: isActivating }] = useActivateOrganisationMutation()
  const [suspendOrganisation, { isLoading: isSuspending }] = useSuspendOrganisationMutation()
  const canManageOrganisations = isMasterAdmin(user as UserWithOrganisations | null)

  const organisations = useMemo(() => data?.data ?? [], [data?.data])
  const meta = data?.meta_data
  const totalItems = meta?.items ?? 0
  const totalPages = meta?.pages ?? 0

  // Stable callbacks; list refetches via RTK Query cache invalidation (invalidatesTags: ["Organisation"])
  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleCreateCancel = useCallback(() => {
    setIsCreateDialogOpen(false)
  }, [])

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    setSelectedOrganisation(null)
  }, [])

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
      toast.success(t("toastActivated"))
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastActivateFailed")
      toast.error(errorMessage)
    }
  }, [activateOrganisation, t])

  const handleSuspend = useCallback(async (org: Organisation) => {
    try {
      await suspendOrganisation(org.id).unwrap()
      toast.success(t("toastSuspended"))
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastSuspendFailed")
      toast.error(errorMessage)
    }
  }, [suspendOrganisation, t])

  const handleExportCsv = () => {
    if (organisations.length === 0) {
      toast.info(t("noDataToExport"))
      return
    }

    const headers = [t("name"), t("status")]
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
    toast.success(t("csvExported"))
  }

  const handleExportPdf = () => {
    if (organisations.length === 0) {
      toast.info(t("noDataToExport"))
      return
    }
    const headers = [t("name"), t("status")]
    const rows = organisations.map((org: Organisation) => [org.name, org.status])
    void exportTableToPdf({ title: t("pdfTitle"), headers, rows })
    toast.success(t("pdfExported"))
  }

  const columns: ColumnDef<Organisation>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("name"),
        cell: ({ row }) => {
          return <div className="font-medium">{row.original.name}</div>
        },
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge
              variant={status === "active" ? "default" : "destructive"}
            >
              {status === "active" ? t("active") : t("suspended")}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: t("actions"),
        cell: ({ row }) => {
          const org = row.original
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => routerRef.current.push(`/organisations/${org.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("view")}
              </Button>
              {canManageOrganisations && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(org)}
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
                      {org.status === "suspended" ? (
                        <DropdownMenuItem
                          onClick={() => handleActivate(org)}
                          disabled={isActivating}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("activate")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleSuspend(org)}
                          disabled={isSuspending}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("suspend")}
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
    [canManageOrganisations, handleEdit, handleActivate, handleSuspend, isActivating, isSuspending, t]
  )

  const table = useReactTable({
    data: organisations,
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
            placeholder={t("searchPlaceholder")}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {canManageOrganisations && (
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("addOrganisation")}
            </Button>
          )}
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
                  {t("noOrganisationsFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - manual (server-side) */}
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

      {/* Create Organisation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("createTitle")}</DialogTitle>
            <DialogDescription>
              {t("createDescription")}
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
              <DialogTitle>{t("editTitle")}</DialogTitle>
              <DialogDescription>
                {t("editDescription")}
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
