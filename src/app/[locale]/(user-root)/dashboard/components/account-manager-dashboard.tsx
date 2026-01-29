"use client"

import { Building2, MapPin, CreditCard, Users } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import { useGetCentresQuery } from "@/store/api/centres/centreApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AccountManagerDashboard() {
  const user = useAppSelector(selectAuthUser)
  const { data: orgsData } = useGetOrganisationsQuery()
  const { data: centresData } = useGetCentresQuery()
  const { data: paymentsData } = useGetPaymentsQuery()

  // Backend filters to assigned organisations only for AccountManager
  const assignedOrgs = orgsData?.data || []
  const totalOrgs = assignedOrgs.length
  const activeOrgs = assignedOrgs.filter((org) => org.status === "active").length

  // Get centres for assigned organisations (backend filters, but we can also filter client-side)
  const assignedOrgIds = assignedOrgs.map((org) => org.id)
  const allCentres = centresData?.data || []
  const assignedCentres = allCentres.filter((centre) => assignedOrgIds.includes(centre.organisationId))
  const totalCentres = assignedCentres.length

  // Get payments for assigned organisations (backend filters, but we can also filter client-side)
  const allPayments = paymentsData?.data || []
  const assignedPayments = allPayments.filter((payment) => assignedOrgIds.includes(payment.organisationId))
  const totalPayments = assignedPayments.length
  const totalRevenue = assignedPayments.reduce((sum, payment) => {
    if (payment.status === "completed") {
      return sum + payment.amount
    }
    return sum
  }, 0)

  const stats = [
    {
      title: "Assigned Organisations",
      value: totalOrgs,
      subtitle: `${activeOrgs} active`,
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Managed Centres",
      value: totalCentres,
      subtitle: "Across assigned organisations",
      icon: MapPin,
      color: "text-green-600",
    },
    {
      title: "Total Revenue",
      value: `£${totalRevenue.toLocaleString()}`,
      subtitle: `${totalPayments} payments`,
      icon: CreditCard,
      color: "text-purple-600",
    },
    {
      title: "Assigned Organisations",
      value: user?.assignedOrganisationIds?.length || 0,
      subtitle: "In your portfolio",
      icon: Users,
      color: "text-orange-600",
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
