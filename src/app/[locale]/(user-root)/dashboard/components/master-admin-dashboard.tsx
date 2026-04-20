"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Building2, MapPin, CreditCard, DollarSign, FileText, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useGetSystemSummaryQuery,
  useGetStatusOverviewQuery,
} from "@/store/api/dashboard/dashboardApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import { useGetSubscriptionsQuery } from "@/store/api/subscriptions/subscriptionApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { useGetAuditLogsQuery } from "@/store/api/audit-logs/auditLogApi"
import type { AuditLog } from "@/store/api/audit-logs/types"
import { format } from "date-fns"

const AUDIT_ACTION_KEYS: Record<string, string> = {
  system_action: "system_action",
  account_manager_action: "account_manager_action",
  organisation_change: "organisation_change",
  access_change: "access_change",
  centre_change: "centre_change",
  subscription_change: "subscription_change",
  feature_change: "feature_change",
}

function getAuditActionKey(value: string): string {
  return AUDIT_ACTION_KEYS[value] ?? value
}

type LicenseHealth = "ok" | "warning" | "crossed"

function safePct(numerator: number | undefined, denominator: number | undefined): number | null {
  if (!numerator || !denominator || denominator <= 0) return null
  return (numerator / denominator) * 100
}

function computeLicenseHealth(sub: { warningStatus?: string; usedLicenses?: number; usedUsers?: number; remainingLicenses?: number; maxAllowedLicenses?: number; userLimit?: number; warningThresholdPercentage?: number }): LicenseHealth {
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

export function MasterAdminDashboard() {
  const t = useTranslations("dashboard.masterAdmin")
  const ts = useTranslations("subscriptions")
  const { data: summaryData, isLoading: summaryLoading, isError: summaryError } = useGetSystemSummaryQuery()
  const { data: statusData, isLoading: statusLoading } = useGetStatusOverviewQuery()
  const { data: orgsFallback } = useGetOrganisationsQuery({ page: 1, limit: 1 }, { skip: !summaryError })
  const { data: orgsData } = useGetOrganisationsQuery()
  const { data: subscriptionsData } = useGetSubscriptionsQuery()
  const { data: paymentsData } = useGetPaymentsQuery({ limit: 100 })
  const { data: auditLogsData, isLoading: auditLoading } = useGetAuditLogsQuery({ limit: 10 })

  const summary = summaryData?.data
  const status = statusData?.data

  const totalOrgs = useMemo(() => {
    if (summary?.totalOrganisations != null) return summary.totalOrganisations
    if (summaryError && orgsFallback?.meta_data?.items != null) return orgsFallback.meta_data.items
    return 0
  }, [summary?.totalOrganisations, summaryError, orgsFallback?.meta_data?.items])

  const activeOrgs = useMemo(() => {
    if (summary?.activeOrganisations != null) return summary.activeOrganisations
    if (status?.organisations?.active != null) return status.organisations.active
    return 0
  }, [summary?.activeOrganisations, status?.organisations?.active])

  const totalCentres = useMemo(() => {
    if (summary?.totalCentres != null) return summary.totalCentres
    return 0
  }, [summary?.totalCentres])

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
  const kpiLoading = summaryLoading || statusLoading

  const orgMap = useMemo(() => {
    const organisations = (orgsData?.data ?? []) as Array<{ id: number; name: string }>
    return new Map(organisations.map((o) => [o.id, o.name]))
  }, [orgsData?.data])

  const licenseHealth = useMemo(() => {
    const subs = subscriptionsData?.data ?? []
    let warningCount = 0
    let crossedCount = 0
    const withRemaining = subs.map((s) => {
      const used = s.usedLicenses ?? s.usedUsers
      const maxAllowed = s.maxAllowedLicenses ?? s.userLimit
      const remaining = s.remainingLicenses ?? (typeof used === "number" && typeof maxAllowed === "number" ? maxAllowed - used : 0)
      const health = computeLicenseHealth(s)
      if (health === "warning") warningCount += 1
      if (health === "crossed") crossedCount += 1
      return { ...s, remaining, health }
    })
    const topLowRemaining = withRemaining
      .slice()
      .sort((a, b) => (a.remaining ?? 0) - (b.remaining ?? 0))
      .slice(0, 5)
    return { warningCount, crossedCount, topLowRemaining }
  }, [subscriptionsData?.data])

  const stats = [
    {
      title: t("totalOrganisations"),
      value: totalOrgs,
      subtitle: `${activeOrgs} ${t("active")}`,
      icon: Building2,
      color: "text-primary",
    },
    {
      title: t("totalCentres"),
      value: totalCentres,
      subtitle: status ? `${status.centres?.active ?? 0} ${t("active")} / ${status.centres?.suspended ?? 0} ${t("suspended")}` : t("acrossAllOrgs"),
      icon: MapPin,
      color: "text-accent",
    },
    {
      title: t("activeSubscriptions"),
      value: activeSubscriptions,
      subtitle: totalSubscriptions ? `${totalSubscriptions} ${t("total")}` : t("activePlans"),
      icon: CreditCard,
      color: "text-secondary",
    },
    {
      title: t("totalRevenue"),
      value: `£${revenueFromPayments.toLocaleString()}`,
      subtitle: recentPaymentCount ? t("fromPaymentsCount", { count: recentPaymentCount }) : t("fromRecentPayments"),
      icon: DollarSign,
      color: "text-secondary",
    },
  ]

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
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
            <CreditCard className="h-4 w-4" />
            {ts("dashboard.licenseHealthTitle")}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/subscriptions" className="gap-1">
              {ts("dashboard.viewSubscriptions")}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              <AlertTriangle className="h-3 w-3" />
              {ts("dashboard.warningCount", { count: licenseHealth.warningCount })}
            </Badge>
            <Badge variant="destructive">
              <CheckCircle2 className="h-3 w-3" />
              {ts("dashboard.crossedCount", { count: licenseHealth.crossedCount })}
            </Badge>
          </div>

          {licenseHealth.topLowRemaining.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ts("dashboard.noSubscriptions")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ts("dashboard.columns.organisation")}</TableHead>
                  <TableHead className="text-right">{ts("dashboard.columns.remaining")}</TableHead>
                  <TableHead className="text-right">{ts("dashboard.columns.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenseHealth.topLowRemaining.map((sub) => {
                  const orgName = orgMap.get(sub.organisationId) ?? `#${sub.organisationId}`
                  const badgeVariant =
                    sub.health === "crossed"
                      ? "destructive"
                      : sub.health === "warning"
                        ? "secondary"
                        : "outline"
                  const BadgeIcon =
                    sub.health === "crossed"
                      ? CheckCircle2
                      : sub.health === "warning"
                        ? AlertTriangle
                        : null
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{orgName}</TableCell>
                      <TableCell className="text-right tabular-nums">{sub.remaining}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={badgeVariant}>
                          {BadgeIcon ? <BadgeIcon className="h-3 w-3" /> : null}
                          {ts(`subscriptionsTable.licenseHealth.${sub.health}` as "subscriptionsTable.licenseHealth.ok")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("recentAuditEvents")}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audit-logs" className="gap-1">
              {t("viewAll")}
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
            <p className="text-sm text-muted-foreground py-4">{t("noRecentAuditEvents")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">{t("action")}</TableHead>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("organisation")}</TableHead>
                  <TableHead className="text-right">{t("date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => {
                  const actionKey = getAuditActionKey(log.actionType)
                  const actionLabel =
                    log.actionType in AUDIT_ACTION_KEYS
                      ? t(("auditActions." + actionKey) as "auditActions.system_action" | "auditActions.account_manager_action" | "auditActions.organisation_change" | "auditActions.access_change" | "auditActions.centre_change" | "auditActions.subscription_change" | "auditActions.feature_change")
                      : log.actionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                  return (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {actionLabel}
                    </TableCell>
                    <TableCell>{log.userName ?? log.userEmail ?? "—"}</TableCell>
                    <TableCell>{log.organisationName ?? "—"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy HH:mm") : "—"}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
