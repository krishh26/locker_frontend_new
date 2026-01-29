"use client"

import { Building2, MapPin, CreditCard, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import { useGetCentresQuery } from "@/store/api/centres/centreApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { useGetAuditLogsQuery } from "@/store/api/audit-logs/auditLogApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MasterAdminDashboard() {
  const { data: orgsData } = useGetOrganisationsQuery()
  const { data: centresData } = useGetCentresQuery()
  const { data: paymentsData } = useGetPaymentsQuery()
  const { data: auditLogsData } = useGetAuditLogsQuery()

  const totalOrgs = orgsData?.data?.length || 0
  const activeOrgs = orgsData?.data?.filter((org) => org.status === "active").length || 0
  const totalCentres = centresData?.data?.length || 0
  const totalPayments = paymentsData?.data?.length || 0
  const totalRevenue = paymentsData?.data?.reduce((sum, payment) => {
    if (payment.status === "completed") {
      return sum + payment.amount
    }
    return sum
  }, 0) || 0
  const recentLogs = auditLogsData?.data?.length || 0

  const stats = [
    {
      title: "Total Organisations",
      value: totalOrgs,
      subtitle: `${activeOrgs} active`,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Total Centres",
      value: totalCentres,
      subtitle: "Across all organisations",
      icon: MapPin,
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `£${totalRevenue.toLocaleString()}`,
      subtitle: `${totalPayments} payments`,
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Recent Activity",
      value: recentLogs,
      subtitle: "Audit log entries",
      icon: CreditCard,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Master Admin Dashboard"
        subtitle="Overview of all organisations, centres, and system activity"
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
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
