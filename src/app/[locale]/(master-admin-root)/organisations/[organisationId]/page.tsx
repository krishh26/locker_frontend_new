"use client"

import { useParams, useRouter } from "next/navigation"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { canAccessOrganisation } from "@/utils/permissions"
import { useGetOrganisationQuery } from "@/store/api/organisations/organisationApi"
import { useGetCentresQuery } from "@/store/api/centres/centreApi"
import { useGetSubscriptionQuery } from "@/store/api/subscriptions/subscriptionApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { PageHeader } from "@/components/dashboard/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, CreditCard, DollarSign, Users } from "lucide-react"
import { useEffect } from "react"

export default function OrganisationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organisationId = Number(params.organisationId)
  const user = useAppSelector(selectAuthUser)

  // Check access before rendering
  useEffect(() => {
    if (!canAccessOrganisation(user, organisationId)) {
      router.push("/errors/unauthorized")
    }
  }, [user, organisationId, router])

  const { data: orgData, isLoading: isLoadingOrg } = useGetOrganisationQuery(organisationId)
  const { data: centresData, isLoading: isLoadingCentres } = useGetCentresQuery({ organisationId })
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionQuery(organisationId)
  const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsQuery({ organisationId })

  const organisation = orgData?.data
  const centres = centresData?.data || []
  const subscription = subscriptionData?.data
  const payments = paymentsData?.data || []

  // Placeholder for admins - API not yet implemented
  interface Admin {
    id: number
    name: string
    email: string
    role: string
  }
  const admins: Admin[] = []
  const isAPILoading = isLoadingOrg || isLoadingCentres || isLoadingSubscription || isLoadingPayments

  if (!canAccessOrganisation(user, organisationId)) {
    return null // Will redirect in useEffect
  }

  // Show loading state while fetching organisation data
  if (isAPILoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Loading..." />
        <div className="text-center py-8 text-muted-foreground">
          Loading organisation details...
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Organisation Not Found" />
        <div className="text-center py-8 text-muted-foreground">
          The organisation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={organisation.name}
        subtitle={`Organisation ID: ${organisation.id}`}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="centres">Centres</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organisation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <p className="text-sm text-muted-foreground">{organisation.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant={organisation.status === "active" ? "default" : "destructive"}
                    >
                      {organisation.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">ID:</span>
                  <p className="text-sm text-muted-foreground">{organisation.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Total Centres:</span>
                  <p className="text-sm text-muted-foreground">{centres.length}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Active Centres:</span>
                  <p className="text-sm text-muted-foreground">
                    {centres.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Total Payments:</span>
                  <p className="text-sm text-muted-foreground">{payments.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="centres">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Centres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {centres.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No centres found for this organisation
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centres.map((centre) => (
                      <TableRow key={centre.id}>
                        <TableCell className="font-medium">{centre.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={centre.status === "active" ? "default" : "destructive"}
                          >
                            {centre.status === "active" ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organisation Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{admin.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div>
                    <span className="text-sm font-medium">Plan:</span>
                    <p className="text-sm text-muted-foreground">{subscription.plan}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">User Limit:</span>
                    <p className="text-sm text-muted-foreground">
                      {subscription.usedUsers} / {subscription.userLimit} users
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <div className="mt-1">
                      <Badge variant={subscription.isExpired ? "destructive" : "default"}>
                        {subscription.isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Expiry Date:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(subscription.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No subscription found for this organisation
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment history found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          £{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : payment.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.invoiceNumber || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
