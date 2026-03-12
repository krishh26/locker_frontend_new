"use client"

import { useState, useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
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
import { Search, Download, Building2, FileText, Clock } from "lucide-react"
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
import { DataTablePagination } from "@/components/data-table-pagination"
import { useGetAuditLogsQuery } from "@/store/api/audit-logs/auditLogApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { AuditLog } from "@/store/api/audit-logs/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { exportTableToPdf } from "@/utils/pdfExport"

export function AuditLogsDataTable() {
  const t = useTranslations("auditLogs")
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

  const formatDetails = (details: AuditLog["details"]): string => {
    if (details == null) return t("common.notAvailable")
    if (typeof details === "string") return details
    return JSON.stringify(details, null, 2)
  }

  const getActionTypeLabel = (value: string): string => {
    if (!value) return t("common.dash")
    const key = `actionTypes.${value}` as const
    const translated = t(key, {
      // allow unknown keys to fall back via catch below
    } as never)
    if (translated && translated !== key) return translated
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  // API queries with filters
  const { data: logsData, isLoading } = useGetAuditLogsQuery({
    organisationId: orgFilter !== "all" ? Number(orgFilter) : undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
  })
  const { data: orgsData } = useGetOrganisationsQuery()

  const logs = useMemo(() => logsData?.data || [], [logsData])
  const organisations = useMemo(() => orgsData?.data || [], [orgsData])
  const orgMap = useMemo(() => new Map(organisations.map((org: { id: number; name: string }) => [org.id, org.name])), [organisations])

  // Get unique actions for filter (use actionType from backend)
  const uniqueActions = useMemo(() => {
    return Array.from(new Set(logs.map((log: AuditLog) => log.actionType))) as string[]
  }, [logs])

  // Apply client-side filters (for user/details search)
  const filteredLogs = useMemo(() => {
    return logs.filter((log: AuditLog) => {
      if (!globalFilter) return true
      const search = globalFilter.toLowerCase()
      const detailsStr = formatDetails(log.details).toLowerCase()
      return (
        log.userName.toLowerCase().includes(search) ||
        detailsStr.includes(search)
      )
    })
  }, [logs, globalFilter])

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.info(t("toast.noDataToExport"))
      return
    }

    const headers = [
      t("table.columns.timestamp"),
      t("table.columns.organisation"),
      t("table.columns.action"),
      t("table.columns.user"),
      t("table.columns.details"),
    ]
    const rows = filteredLogs.map((log: AuditLog) => [
      new Date(log.createdAt).toLocaleString(),
      log.organisationName ??
        orgMap.get(log.organisationId ?? 0) ??
        t("common.dash"),
      getActionTypeLabel(log.actionType),
      log.userName,
      formatDetails(log.details),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `audit-logs_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t("toast.csvExported"))
  }

  const handleExportPdf = () => {
    const headers = [
      t("table.columns.timestamp"),
      t("table.columns.organisation"),
      t("table.columns.action"),
      t("table.columns.user"),
      t("table.columns.details"),
    ]
    const rows = filteredLogs.map((log: AuditLog) => [
      new Date(log.createdAt).toLocaleString(),
      log.organisationName ??
        orgMap.get(log.organisationId ?? 0) ??
        t("common.dash"),
      getActionTypeLabel(log.actionType),
      log.userName,
      formatDetails(log.details),
    ])
    if (rows.length === 0) {
      toast.info(t("toast.noDataToExport"))
      return
    }
    exportTableToPdf({ title: t("page.title"), headers, rows })
    toast.success(t("toast.pdfExported"))
  }

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: t("table.columns.timestamp"),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {new Date(row.original.createdAt).toLocaleString()}
            </div>
          )
        },
      },
      {
        accessorKey: "organisationId",
        header: t("table.columns.organisation"),
        cell: ({ row }) => {
          const orgName =
            row.original.organisationName ??
            (row.original.organisationId != null
              ? orgMap.get(row.original.organisationId)
              : null) ??
            t("common.dash")
          const orgId = row.original.organisationId
          if (orgId != null) {
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
          }
          return (
            <span className="text-muted-foreground">
              <Building2 className="h-4 w-4 mr-2 inline" />
              {orgName}
            </span>
          )
        },
      },
      {
        accessorKey: "actionType",
        header: t("table.columns.action"),
        cell: ({ row }) => {
          return (
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {getActionTypeLabel(row.original.actionType)}
            </Badge>
          )
        },
      },
      {
        accessorKey: "userName",
        header: t("table.columns.user"),
        cell: ({ row }) => {
          const log = row.original
          return (
            <div>
              <div className="font-medium">{log.userName}</div>
              {log.userEmail && (
                <div className="text-muted-foreground text-xs">
                  {log.userEmail}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "details",
        header: t("table.columns.details"),
        cell: ({ row }) => {
          return (
            <div className="max-w-md truncate font-mono text-xs">
              {formatDetails(row.original.details)}
            </div>
          )
        },
      },
    ],
    [orgMap, router, t]
  )

  const table = useReactTable({
    data: filteredLogs,
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
      <div className="@container/main">
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
    <div className="@container/main">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 mb-4">
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
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("table.filters.actionPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("table.filters.allActions")}</SelectItem>
                {uniqueActions.map((action: string) => (
                  <SelectItem key={action} value={action}>
                    {getActionTypeLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t("table.filters.orgPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("table.filters.allOrganisations")}</SelectItem>
                {organisations.map((org: { id: number; name: string }) => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />
    </div>
  )
}
