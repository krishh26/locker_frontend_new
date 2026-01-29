"use client"

import { useParams, useRouter } from "next/navigation"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { canAccessOrganisation, isMasterAdmin } from "@/utils/permissions"
import {
  useGetOrganisationQuery,
  useActivateOrganisationMutation,
  useSuspendOrganisationMutation,
} from "@/store/api/organisations/organisationApi"
import { useGetSubscriptionQuery } from "@/store/api/subscriptions/subscriptionApi"
import { useGetPaymentsQuery } from "@/store/api/payments/paymentApi"
import { PageHeader } from "@/components/dashboard/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, CreditCard, DollarSign, Users, Edit, CheckCircle, XCircle, Plus } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { EditOrganisationForm } from "../components/edit-organisation-form"
import { AssignAdminDialog } from "../components/assign-admin-dialog"
import { useGetUsersByRoleQuery } from "@/store/api/user/userApi"

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

  const { data: orgData, isLoading: isLoadingOrg, refetch: refetchOrg } = useGetOrganisationQuery(organisationId)
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionQuery(organisationId)
  const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsQuery({ organisationId })
  const { data: adminsData, isLoading: isLoadingAdmins } = useGetUsersByRoleQuery("Admin")
  const [activateOrganisation, { isLoading: isActivating }] = useActivateOrganisationMutation()
  const [suspendOrganisation, { isLoading: isSuspending }] = useSuspendOrganisationMutation()

  const organisation = orgData?.data
  const centres = organisation?.centres ?? []
  const subscription = subscriptionData?.data
  const payments = paymentsData?.data || []
  const allAdmins = adminsData?.data || []

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignAdminDialogOpen, setIsAssignAdminDialogOpen] = useState(false)
  const canEdit = isMasterAdmin(user)

  const isAPILoading = isLoadingOrg || isLoadingSubscription || isLoadingPayments || isLoadingAdmins

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    refetchOrg()
  }, [refetchOrg])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
  }, [])

  const handleActivate = useCallback(async () => {
    if (!organisation) return
    try {
      await activateOrganisation(organisation.id).unwrap()
      toast.success("Organisation activated successfully")
      refetchOrg()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate organisation"
      toast.error(errorMessage)
    }
  }, [organisation, activateOrganisation, refetchOrg])

  const handleSuspend = useCallback(async () => {
    if (!organisation) return
    try {
      await suspendOrganisation(organisation.id).unwrap()
      toast.success("Organisation suspended successfully")
      refetchOrg()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to suspend organisation"
      toast.error(errorMessage)
    }
  }, [organisation, suspendOrganisation, refetchOrg])

  const handleAssignAdminSuccess = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
    refetchOrg()
  }, [refetchOrg])

  const handleAssignAdminCancel = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
  }, [])

  if (!canAccessOrganisation(user, organisationId)) {
    return null // Will redirect in useEffect
  }

  // Show loading state while fetching organisation data
  if (isAPILoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader title="Loading..." />
        <div className="text-center py-8 text-muted-foreground">
          Loading organisation details...
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader title="Organisation Not Found" />
        <div className="text-center py-8 text-muted-foreground">
          The organisation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={organisation.name}
          subtitle={`Organisation ID: ${organisation.id}`}
          showBackButton
        />
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {organisation.status === "suspended" ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleActivate}
                disabled={isActivating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspend}
                disabled={isSuspending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Suspend
              </Button>
            )}
          </div>
        )}
      </div>

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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organisation Admins
                </CardTitle>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => setIsAssignAdminDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Admin
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAdmins ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading admins...
                </div>
              ) : allAdmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admin users found. Create admin users first.
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage which admins can access this organisation. Use the dialog to assign or remove admins.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allAdmins.map((admin) => (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium">
                            {admin.first_name} {admin.last_name}
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {admin.roles.map((role) => (
                                <Badge key={role} variant="secondary">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
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

      {/* Edit Organisation Dialog */}
      {organisation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Organisation</DialogTitle>
              <DialogDescription>
                Update organisation details. Only MasterAdmin can edit organisations.
              </DialogDescription>
            </DialogHeader>
            <EditOrganisationForm
              organisation={organisation}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Admin Dialog */}
      {organisation && (
        <Dialog open={isAssignAdminDialogOpen} onOpenChange={setIsAssignAdminDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Admins to Organisation</DialogTitle>
              <DialogDescription>
                Select which admins can manage this organisation. Click to assign or remove.
              </DialogDescription>
            </DialogHeader>
            <AssignAdminDialog
              organisationId={organisation.id}
              currentAdmins={organisation.admins || []}
              onSuccess={handleAssignAdminSuccess}
              onCancel={handleAssignAdminCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
