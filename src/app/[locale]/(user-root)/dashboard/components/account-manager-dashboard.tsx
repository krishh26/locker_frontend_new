"use client"

import { useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { Building2, MapPin, CreditCard, DollarSign, FileText, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGetSystemSummaryQuery,
  useGetStatusOverviewQuery,
} from "@/store/api/dashboard/dashboardApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { useGetAuditLogsQuery } from "@/store/api/audit-logs/auditLogApi"
import type { AuditLog } from "@/store/api/audit-logs/types"
import { format } from "date-fns"

const AUDIT_ACTION_LABELS: Record<string, string> = {
  system_action: "System Action",
  account_manager_action: "Account Manager Action",
  organisation_change: "Organisation Change",
  access_change: "Access Change",
  centre_change: "Centre Change",
  subscription_change: "Subscription Change",
  feature_change: "Feature Change",
}

function getAuditActionLabel(value: string): string {
  return AUDIT_ACTION_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AccountManagerDashboard() {
  const { data: summaryData, isLoading: summaryLoading } = useGetSystemSummaryQuery()
  const { data: statusData, isLoading: statusLoading } = useGetStatusOverviewQuery()
  const { data: paymentsData } = useGetPaymentsQuery({ limit: 100 })
  const { data: auditLogsData, isLoading: auditLoading } = useGetAuditLogsQuery({ limit: 10 })

  const summary = summaryData?.data
  const status = statusData?.data
  const kpiLoading = summaryLoading || statusLoading

  const totalOrgs = summary?.totalOrganisations ?? 0
  const activeOrgs = summary?.activeOrganisations ?? status?.organisations?.active ?? 0
  const totalCentres = summary?.totalCentres ?? 0
  const activeSubscriptions = summary?.activeSubscriptions ?? 0
  const totalSubscriptions = summary?.totalSubscriptions ?? 0

  const revenueFromPayments = useMemo(() => {
    const payments = paymentsData?.data ?? []
    return payments
      .filter((p) => p.status === "sent")
      .reduce((sum, p) => sum + p.amount, 0)
  }, [paymentsData?.data])
  const recentPaymentCount = paymentsData?.data?.length ?? 0

  const recentLogs = useMemo(() => (auditLogsData?.data ?? []) as AuditLog[], [auditLogsData?.data]).slice(0, 5)

  const stats = [
    {
      title: "Assigned Organisations",
      value: totalOrgs,
      subtitle: `${activeOrgs} active`,
      icon: Building2,
      color: "text-primary",
    },
    {
      title: "Managed Centres",
      value: totalCentres,
      subtitle: status ? `${status.centres?.active ?? 0} active / ${status.centres?.suspended ?? 0} suspended` : "Across assigned organisations",
      icon: MapPin,
      color: "text-accent",
    },
    {
      title: "Active Subscriptions",
      value: activeSubscriptions,
      subtitle: totalSubscriptions ? `${totalSubscriptions} total` : "Active plans",
      icon: CreditCard,
      color: "text-secondary",
    },
    {
      title: "Total Revenue",
      value: `£${revenueFromPayments.toLocaleString()}`,
      subtitle: recentPaymentCount ? `From ${recentPaymentCount} recent payments` : "From recent payments",
      icon: DollarSign,
      color: "text-secondary",
    },
  ]

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Account Manager Dashboard"
        subtitle={`Managing ${totalOrgs} assigned organisation${totalOrgs !== 1 ? "s" : ""}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Recent audit events
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audit-logs" className="gap-1">
              View all
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent audit events.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {getAuditActionLabel(log.actionType)}
                    </TableCell>
                    <TableCell>{log.userName ?? log.userEmail ?? "—"}</TableCell>
                    <TableCell>{log.organisationName ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
