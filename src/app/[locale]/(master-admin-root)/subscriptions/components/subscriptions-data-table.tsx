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
import { Search, Download, Building2, CreditCard, Plus, MoreVertical, RefreshCw, Ban, AlertTriangle, CheckCircle } from "lucide-react"
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
import { useTranslations } from "next-intl"

type LicenseHealth = "ok" | "warning" | "crossed"

function safePct(numerator: number | undefined, denominator: number | undefined): number | null {
  if (!numerator || !denominator || denominator <= 0) return null
  return (numerator / denominator) * 100
}

function computeLicenseHealth(sub: Subscription): LicenseHealth {
  const ws = (sub.warningStatus ?? "").toLowerCase()
  if (ws === "crossed") return "crossed"
  if (ws === "warning") return "warning"
  if (ws === "none") return "ok"

  const used = sub.usedLicenses ?? sub.usedUsers
  const maxAllowed = sub.maxAllowedLicenses ?? sub.userLimit
  const remaining = sub.remainingLicenses
  const crossed =
    (typeof remaining === "number" && remaining < 0) ||
    (typeof used === "number" && typeof maxAllowed === "number" && used > maxAllowed)
  if (crossed) return "crossed"

  const pct = safePct(used, maxAllowed)
  const threshold = sub.warningThresholdPercentage
  if (pct != null && typeof threshold === "number" && pct >= threshold) return "warning"
  return "ok"
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}

export function SubscriptionsDataTable() {
  const t = useTranslations("subscriptions")
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
      toast.info(t("toast.noDataToExport"))
      return
    }

    const headers = [
      t("subscriptionsTable.columns.organisation"),
      t("subscriptionsTable.columns.plan"),
      t("subscriptionsTable.columns.users"),
      t("subscriptionsTable.columns.licenseStatus"),
      t("subscriptionsTable.columns.status"),
      t("subscriptionsTable.columns.expiryDate"),
    ]
    const rows = filteredSubscriptions.map((sub) => [
      orgMap.get(sub.organisationId) || t("common.unknown"),
      sub.plan,
      `${sub.usedLicenses ?? sub.usedUsers} / ${sub.totalLicenses ?? sub.userLimit} (${t("subscriptionsTable.licensesRemaining", { count: sub.remainingLicenses ?? Math.max(0, (sub.maxAllowedLicenses ?? sub.userLimit) - (sub.usedLicenses ?? sub.usedUsers)) })})`,
      t(`subscriptionsTable.licenseHealth.${computeLicenseHealth(sub)}` as "subscriptionsTable.licenseHealth.ok"),
      sub.isExpired
        ? t("subscriptionsTable.status.expired")
        : t("subscriptionsTable.status.active"),
      formatDate(sub.endDate ?? sub.expiryDate),
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
    toast.success(t("toast.csvExported"))
  }

  const handleExportPdf = () => {
    if (filteredSubscriptions.length === 0) {
      toast.info(t("toast.noDataToExport"))
      return
    }
    const headers = [
      t("subscriptionsTable.columns.organisation"),
      t("subscriptionsTable.columns.plan"),
      t("subscriptionsTable.columns.users"),
      t("subscriptionsTable.columns.licenseStatus"),
      t("subscriptionsTable.columns.status"),
      t("subscriptionsTable.columns.expiryDate"),
    ]
    const rows = filteredSubscriptions.map((sub) => [
      orgMap.get(sub.organisationId) || t("common.unknown"),
      sub.plan,
      `${sub.usedLicenses ?? sub.usedUsers} / ${sub.totalLicenses ?? sub.userLimit} (${t("subscriptionsTable.licensesRemaining", { count: sub.remainingLicenses ?? Math.max(0, (sub.maxAllowedLicenses ?? sub.userLimit) - (sub.usedLicenses ?? sub.usedUsers)) })})`,
      t(`subscriptionsTable.licenseHealth.${computeLicenseHealth(sub)}` as "subscriptionsTable.licenseHealth.ok"),
      sub.isExpired
        ? t("subscriptionsTable.status.expired")
        : t("subscriptionsTable.status.active"),
      formatDate(sub.endDate ?? sub.expiryDate),
    ])
    void exportTableToPdf({ title: t("page.title"), headers, rows })
    toast.success(t("toast.pdfExported"))
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
        header: t("subscriptionsTable.columns.organisation"),
        cell: ({ row }) => {
          const orgName = orgMap.get(row.original.organisationId) || t("common.unknown")
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
        header: t("subscriptionsTable.columns.plan"),
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
        id: "licenses",
        header: t("subscriptionsTable.columns.users"),
        cell: ({ row }) => {
          const sub = row.original
          const used = sub.usedLicenses ?? sub.usedUsers
          const total = sub.totalLicenses ?? sub.userLimit
          const remaining =
            sub.remainingLicenses ??
            (typeof used === "number" && typeof (sub.maxAllowedLicenses ?? sub.userLimit) === "number"
              ? (sub.maxAllowedLicenses ?? sub.userLimit) - used
              : undefined)
          const health = computeLicenseHealth(sub)

          const badgeVariant =
            health === "crossed" ? "destructive" : health === "warning" ? "secondary" : "outline"
          const BadgeIcon = health === "crossed" ? CheckCircle : health === "warning" ? AlertTriangle : null

          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="tabular-nums">
                  {used} / {total}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("subscriptionsTable.licensesRemaining", { count: remaining ?? 0 })}
                </span>
              </div>
              <Badge variant={badgeVariant}>
                {BadgeIcon ? <BadgeIcon className="h-3 w-3" /> : null}
                {t(`subscriptionsTable.licenseHealth.${health}` as "subscriptionsTable.licenseHealth.ok")}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: t("subscriptionsTable.columns.status"),
        cell: ({ row }) => {
          const isExpired = row.original.isExpired
          return (
            <Badge variant={isExpired ? "destructive" : "default"}>
              {isExpired
                ? t("subscriptionsTable.status.expired")
                : t("subscriptionsTable.status.active")}
            </Badge>
          )
        },
      },
      {
        accessorKey: "expiryDate",
        header: t("subscriptionsTable.columns.expiryDate"),
        cell: ({ row }) => {
          return formatDate(row.original.endDate ?? row.original.expiryDate)
        },
      },
      {
        id: "actions",
        header: t("subscriptionsTable.columns.actions"),
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
                  {t("subscriptionsTable.actionsMenu.changePlan")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSuspendAccessSub(sub)}>
                  <Ban className="h-4 w-4 mr-2" />
                  {t("subscriptionsTable.actionsMenu.suspendAccess")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [orgMap, router, t]
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
            placeholder={t("subscriptionsTable.searchPlaceholder")}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setIsAssignPlanOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("subscriptionsTable.buttons.assignPlan")}
          </Button>
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
                  {t("subscriptionsTable.empty")}
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
            <DialogTitle>{t("subscriptionsTable.dialogs.assignPlan.title")}</DialogTitle>
            <DialogDescription>
              {t("subscriptionsTable.dialogs.assignPlan.description")}
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
              <DialogTitle>{t("subscriptionsTable.dialogs.changePlan.title")}</DialogTitle>
              <DialogDescription>
                {t("subscriptionsTable.dialogs.changePlan.description")}
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
              <DialogTitle>{t("subscriptionsTable.dialogs.suspendAccess.title")}</DialogTitle>
              <DialogDescription>
                {t("subscriptionsTable.dialogs.suspendAccess.description")}
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
