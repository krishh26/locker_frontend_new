"use client"

import { useState, useMemo } from "react"
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

/** Format details for display (backend may return an object or string) */
function formatDetails(details: AuditLog["details"]): string {
  if (details == null) return "N/A"
  if (typeof details === "string") return details
  return JSON.stringify(details, null, 2)
}

/** Map backend AuditActionType enum to human-readable labels */
const ACTION_TYPE_LABELS: Record<string, string> = {
  system_action: "System Action",
  account_manager_action: "Account Manager Action",
  organisation_change: "Organisation Change",
  access_change: "Access Change",
  centre_change: "Centre Change",
  subscription_change: "Subscription Change",
  feature_change: "Feature Change",
}

function getActionTypeLabel(value: string): string {
  return ACTION_TYPE_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AuditLogsDataTable() {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [orgFilter, setOrgFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")

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
      toast.info("No data to export")
      return
    }

    const headers = ["Timestamp", "Organisation", "Action", "User", "Details"]
    const rows = filteredLogs.map((log: AuditLog) => [
      new Date(log.createdAt).toLocaleString(),
      log.organisationName ?? orgMap.get(log.organisationId ?? 0) ?? "—",
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
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    toast.info("PDF export coming soon")
  }

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
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
        header: "Organisation",
        cell: ({ row }) => {
          const orgName =
            row.original.organisationName ??
            (row.original.organisationId != null
              ? orgMap.get(row.original.organisationId)
              : null) ??
            "—"
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
        header: "Action",
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
        header: "User",
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
        header: "Details",
        cell: ({ row }) => {
          return (
            <div className="max-w-md truncate font-mono text-xs">
              {formatDetails(row.original.details)}
            </div>
          )
        },
      },
    ],
    [orgMap, router]
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
              placeholder="Search by user or details..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action: string) => (
                  <SelectItem key={action} value={action}>
                    {getActionTypeLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organisations</SelectItem>
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
                  No audit logs found.
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
