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
import { Search, Download, Building2, MapPin } from "lucide-react"
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
import { DataTablePagination } from "@/components/data-table-pagination"
import { useGetCentresQuery } from "@/store/api/centres/centreApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { Centre } from "@/store/api/centres/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export function CentresDataTable() {
  const router = useRouter()
  const { data: centresData, isLoading: centresLoading } = useGetCentresQuery()
  const { data: orgsData } = useGetOrganisationsQuery()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const centres = centresData?.data || []
  const organisations = useMemo(() => orgsData?.data || [], [orgsData])
  const orgMap = useMemo(() => new Map(organisations.map((org: { id: number; name: string }) => [org.id, org.name])), [organisations])

  const handleExportCsv = () => {
    if (centres.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Name", "Organisation", "Status"]
    const rows = centres.map((centre: Centre) => [
      centre.name,
      orgMap.get(centre.organisationId) || "Unknown",
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
    toast.info("PDF export coming soon")
  }

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
          const orgName = orgMap.get(row.original.organisationId) || "Unknown"
          return (
            <Button
              variant="link"
              className="h-auto p-0 font-normal"
              onClick={() =>
                router.push(`/organisations/${row.original.organisationId}`)
              }
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
    ],
    [orgMap, router]
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
    </div>
  )
}
