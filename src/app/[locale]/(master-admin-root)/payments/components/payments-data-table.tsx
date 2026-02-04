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
import { Search, Download, Building2, DollarSign, Plus, MoreHorizontal, Pencil } from "lucide-react"
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
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { Payment } from "@/store/api/payments/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { exportTableToPdf } from "@/utils/pdfExport"

export function PaymentsDataTable() {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orgFilter, setOrgFilter] = useState<string>("all")

  // API queries with filters
  const { data: paymentsData, isLoading } = useGetPaymentsQuery({
    organisationId: orgFilter !== "all" ? Number(orgFilter) : undefined,
    status: statusFilter !== "all" ? (statusFilter as "draft" | "sent" | "failed" | "refunded") : undefined,
  })
  const { data: orgsData } = useGetOrganisationsQuery()

  const payments = useMemo(() => paymentsData?.data || [], [paymentsData])
  const organisations = useMemo(() => orgsData?.data || [], [orgsData])
  const orgMap = useMemo(() => new Map(organisations.map((org: { id: number; name: string }) => [org.id, org.name])), [organisations])

  // Apply client-side filters (for invoice number search)
  const filteredPayments = useMemo(() => {
    return payments.filter((payment: Payment) => {
      if (
        globalFilter &&
        !payment.invoiceNumber?.toLowerCase().includes(globalFilter.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [payments, globalFilter])

  const handleExportCsv = () => {
    if (filteredPayments.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Date", "Organisation", "Plan", "Subtotal", "Discount", "Tax", "Amount/Total", "Status", "Invoice Number", "Payment Method"]
    const rows = filteredPayments.map((payment: Payment) => [
      new Date(payment.date).toLocaleDateString(),
      orgMap.get(payment.organisationId) || "Unknown",
      payment.planName ?? "—",
      payment.subtotal != null ? `£${Number(payment.subtotal).toLocaleString()}` : `£${payment.amount.toLocaleString()}`,
      payment.discountValue != null ? `£${Number(payment.discountValue).toLocaleString()}` : "—",
      payment.taxValue != null ? `£${Number(payment.taxValue).toLocaleString()}` : "—",
      payment.total != null ? `£${Number(payment.total).toLocaleString()}` : `£${payment.amount.toLocaleString()}`,
      payment.status === "sent" ? "Sent" : payment.status === "failed" ? "Failed" : payment.status === "refunded" ? "Refunded" : "Draft",
      payment.invoiceNumber || "N/A",
      payment.paymentMethod || "N/A",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    const headers = ["Date", "Organisation", "Plan", "Subtotal", "Discount", "Tax", "Amount/Total", "Status", "Invoice Number", "Payment Method"]
    const rows = filteredPayments.map((payment: Payment) => [
      new Date(payment.date).toLocaleDateString(),
      orgMap.get(payment.organisationId) || "Unknown",
      payment.planName ?? "—",
      payment.subtotal != null ? `£${Number(payment.subtotal).toLocaleString()}` : `£${payment.amount.toLocaleString()}`,
      payment.discountValue != null ? `£${Number(payment.discountValue).toLocaleString()}` : "—",
      payment.taxValue != null ? `£${Number(payment.taxValue).toLocaleString()}` : "—",
      payment.total != null ? `£${Number(payment.total).toLocaleString()}` : `£${payment.amount.toLocaleString()}`,
      payment.status === "sent" ? "Sent" : payment.status === "failed" ? "Failed" : payment.status === "refunded" ? "Refunded" : "Draft",
      payment.invoiceNumber || "N/A",
      payment.paymentMethod || "N/A",
    ])
    if (rows.length === 0) {
      toast.info("No data to export")
      return
    }
    exportTableToPdf({ title: "Payments", headers, rows })
    toast.success("PDF exported successfully")
  }

  const columns: ColumnDef<Payment>[] = useMemo(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          return new Date(row.original.date).toLocaleDateString()
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
                router.push(`/organisations/${row.original.organisationId}?tab=payments`)
              }
            >
              <Building2 className="h-4 w-4 mr-2" />
              {orgName}
            </Button>
          )
        },
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => row.original.planName ?? "—",
      },
      {
        accessorKey: "subtotal",
        header: "Subtotal",
        cell: ({ row }) => {
          const v = row.original.subtotal
          if (v != null) return `£${Number(v).toLocaleString()}`
          return "—"
        },
      },
      {
        accessorKey: "discountValue",
        header: "Discount",
        cell: ({ row }) => {
          const v = row.original.discountValue
          if (v == null) return "—"
          return `£${Number(v).toLocaleString()}`
        },
      },
      {
        accessorKey: "taxValue",
        header: "Tax",
        cell: ({ row }) => {
          const v = row.original.taxValue
          if (v == null) return "—"
          return `£${Number(v).toLocaleString()}`
        },
      },
      {
        accessorKey: "amount",
        header: "Amount / Total",
        cell: ({ row }) => {
          const total = row.original.total
          const amount = row.original.amount
          const display = total != null ? Number(total) : amount
          return (
            <div className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              £{display.toLocaleString()}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          const label = status === "sent" ? "Sent" : status === "failed" ? "Failed" : status === "refunded" ? "Refunded" : "Draft"
          const variant = status === "sent" ? "default" : status === "failed" || status === "refunded" ? "destructive" : "secondary"
          return (
            <Badge variant={variant}>
              {label}
            </Badge>
          )
        },
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice Number",
        cell: ({ row }) => {
          return row.original.invoiceNumber || "N/A"
        },
      },
      {
        accessorKey: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) => {
          return row.original.paymentMethod || "N/A"
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/payments/${row.original.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [orgMap, router]
  )

  const table = useReactTable({
    data: filteredPayments,
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
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => router.push("/payments/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add invoice
            </Button>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
                  No payments found.
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
