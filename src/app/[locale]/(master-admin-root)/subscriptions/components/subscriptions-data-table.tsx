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
import { Search, Download, Building2, CreditCard, AlertCircle, Plus, MoreVertical, RefreshCw, Ban } from "lucide-react"
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
import { useGetSubscriptionsQuery } from "@/store/api/subscriptions/subscriptionApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import { exportTableToPdf } from "@/utils/pdfExport"
import type { Subscription } from "@/store/api/subscriptions/types"
import { toast } from "sonner"
import { AssignPlanDialog } from "./assign-plan-dialog"
import { ChangePlanDialog } from "./change-plan-dialog"
import { SuspendAccessDialog } from "./suspend-access-dialog"

export function SubscriptionsDataTable() {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [isAssignPlanOpen, setIsAssignPlanOpen] = useState(false)
  const [changePlanSub, setChangePlanSub] = useState<Subscription | null>(null)
  const [suspendAccessSub, setSuspendAccessSub] = useState<Subscription | null>(null)

  const { data: subscriptionsData, refetch } = useGetSubscriptionsQuery()
  const { data: orgsData } = useGetOrganisationsQuery()

  const subscriptions = useMemo(() => subscriptionsData?.data || [], [subscriptionsData])
  const organisations = useMemo(() => orgsData?.data || [], [orgsData])
  const orgMap = useMemo(() => new Map(organisations.map((org: { id: number; name: string }) => [org.id, org.name])), [organisations])

  // Apply client-side filters
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription: Subscription) => {
      if (
        globalFilter &&
        !subscription.plan.toLowerCase().includes(globalFilter.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [subscriptions, globalFilter])  

  const handleExportCsv = () => {
    if (filteredSubscriptions.length === 0) {
      toast.info("No data to export")
      return
    }

    const headers = ["Organisation", "Plan", "Users", "Status", "Expiry Date"]
    const rows = filteredSubscriptions.map((sub) => [
      orgMap.get(sub.organisationId) || "Unknown",
      sub.plan,
      `${sub.usedUsers}/${sub.userLimit}`,
      sub.isExpired ? "Expired" : "Active",
      new Date(sub.expiryDate).toLocaleDateString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `subscriptions_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported successfully")
  }

  const handleExportPdf = () => {
    if (filteredSubscriptions.length === 0) {
      toast.info("No data to export")
      return
    }
    const headers = ["Organisation", "Plan", "Users", "Status", "Expiry Date"]
    const rows = filteredSubscriptions.map((sub) => [
      orgMap.get(sub.organisationId) || "Unknown",
      sub.plan,
      `${sub.usedUsers}/${sub.userLimit}`,
      sub.isExpired ? "Expired" : "Active",
      new Date(sub.expiryDate).toLocaleDateString(),
    ])
    exportTableToPdf({ title: "Subscriptions", headers, rows })
    toast.success("PDF exported successfully")
  }

  const handleAssignPlanSuccess = useCallback(() => {
    setIsAssignPlanOpen(false)
    refetch()
  }, [refetch])

  const handleChangePlanSuccess = useCallback(() => {
    setChangePlanSub(null)
    refetch()
  }, [refetch])

  const handleSuspendAccessSuccess = useCallback(() => {
    setSuspendAccessSub(null)
    refetch()
  }, [refetch])

  const columns: ColumnDef<Subscription>[] = useMemo(
    () => [
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
                router.push(`/organisations/${row.original.organisationId}?tab=subscription`)
              }
            >
              <Building2 className="h-4 w-4 mr-2" />
              {orgName}
            </Button>
          )
        },
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => {
          return (
            <div className="font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              {row.original.plan}
            </div>
          )
        },
      },
      {
        accessorKey: "users",
        header: "Users",
        cell: ({ row }) => {
          const sub = row.original
          const isLimitReached = sub.usedUsers >= sub.userLimit
          return (
            <div className="flex items-center gap-2">
              <span>
                {sub.usedUsers} / {sub.userLimit}
              </span>
              {isLimitReached && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isExpired = row.original.isExpired
          return (
            <Badge variant={isExpired ? "destructive" : "default"}>
              {isExpired ? "Expired" : "Active"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry Date",
        cell: ({ row }) => {
          return new Date(row.original.expiryDate).toLocaleDateString()
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const sub = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setChangePlanSub(sub)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Change Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSuspendAccessSub(sub)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Access
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [orgMap, router]
  )

  const table = useReactTable({
    data: filteredSubscriptions,
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

  return (
    <div className="w-full space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setIsAssignPlanOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assign Plan
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
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Assign Plan Dialog */}
      <Dialog open={isAssignPlanOpen} onOpenChange={setIsAssignPlanOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Plan to Organisation</DialogTitle>
            <DialogDescription>
              Select an organisation and a plan to assign.
            </DialogDescription>
          </DialogHeader>
          <AssignPlanDialog onSuccess={handleAssignPlanSuccess} onCancel={() => setIsAssignPlanOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      {changePlanSub && (
        <Dialog open={!!changePlanSub} onOpenChange={(open) => !open && setChangePlanSub(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Plan</DialogTitle>
              <DialogDescription>
                Select a new plan for this organisation.
              </DialogDescription>
            </DialogHeader>
            <ChangePlanDialog
              organisationId={changePlanSub.organisationId}
              organisationName={orgMap.get(changePlanSub.organisationId)}
              onSuccess={handleChangePlanSuccess}
              onCancel={() => setChangePlanSub(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Suspend Access Dialog */}
      {suspendAccessSub && (
        <Dialog open={!!suspendAccessSub} onOpenChange={(open) => !open && setSuspendAccessSub(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Suspend Organisation Access</DialogTitle>
              <DialogDescription>
                Restrict usage for this organisation. Optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <SuspendAccessDialog
              organisationId={suspendAccessSub.organisationId}
              organisationName={orgMap.get(suspendAccessSub.organisationId)}
              onSuccess={handleSuspendAccessSuccess}
              onCancel={() => setSuspendAccessSub(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
