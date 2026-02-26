"use client"

import { useParams, useRouter } from "next/navigation"
import { filterRolesFromApi } from "@/config/auth-roles"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { setMasterAdminOrganisationId, clearMasterAdminOrganisationId } from "@/store/slices/orgContextSlice"
import { canAccessOrganisation, isMasterAdmin, type UserWithOrganisations } from "@/utils/permissions"
import {
  useGetOrganisationQuery,
  useActivateOrganisationMutation,
  useSuspendOrganisationMutation,
} from "@/store/api/organisations/organisationApi"
import { useGetTokenByEmailMutation } from "@/store/api/auth/authApi"
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
import { Building2, MapPin, CreditCard, DollarSign, Users, Edit, CheckCircle, XCircle, Plus, LogIn } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { EditOrganisationForm } from "../components/edit-organisation-form"
import { AssignAdminDialog } from "../components/assign-admin-dialog"

export default function OrganisationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const organisationId = Number(params.organisationId)
  const user = useAppSelector(selectAuthUser)

  // Set MasterAdmin org context when viewing this organisation; clear on leave
  useEffect(() => {
    const isMaster = isMasterAdmin(user as unknown as UserWithOrganisations | null)
    if (isMaster && Number.isInteger(organisationId) && organisationId > 0) {
      dispatch(setMasterAdminOrganisationId(organisationId))
      return () => {
        dispatch(clearMasterAdminOrganisationId())
      }
    }
  }, [user, organisationId, dispatch])

  // Check access before rendering
  useEffect(() => {
    if (!canAccessOrganisation(user as unknown as UserWithOrganisations | null, organisationId)) {
      router.push("/errors/unauthorized")
    }
  }, [user, organisationId, router])

  const { data: orgData, isLoading: isLoadingOrg, refetch: refetchOrg } = useGetOrganisationQuery(organisationId)
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useGetSubscriptionQuery(organisationId)
  const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsQuery({ organisationId })
  const [activateOrganisation, { isLoading: isActivating }] = useActivateOrganisationMutation()
  const [suspendOrganisation, { isLoading: isSuspending }] = useSuspendOrganisationMutation()
  const [getTokenByEmail, { isLoading: isLoggingInAs }] = useGetTokenByEmailMutation()

  const organisation = orgData?.data
  const centres = organisation?.centres ?? []
  const subscription = subscriptionData?.data
  const payments = paymentsData?.data || []

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignOrgAdminDialogOpen, setIsAssignOrgAdminDialogOpen] = useState(false)
  const canEdit = isMasterAdmin(user as unknown as UserWithOrganisations | null)

  const isAPILoading = isLoadingOrg || isLoadingSubscription || isLoadingPayments

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

  const handleAssignOrgAdminSuccess = useCallback(() => {
    setIsAssignOrgAdminDialogOpen(false)
    refetchOrg()
  }, [refetchOrg])

  const handleAssignOrgAdminCancel = useCallback(() => {
    setIsAssignOrgAdminDialogOpen(false)
  }, [])

  const handleLoginAsAdmin = useCallback(async (email: string, adminName: string) => {
    try {
      const result = await getTokenByEmail({ email }).unwrap()
      const key = crypto.randomUUID()
      const storageKey = `locker.impersonate.${key}`
      localStorage.setItem(storageKey, JSON.stringify(result))
      window.open(`/auth/impersonate?key=${key}`, "_blank")
      toast.success(`Opening dashboard as ${adminName} in a new tab`)
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to login as admin"
      toast.error(errorMessage)
    }
  }, [getTokenByEmail])

  if (!canAccessOrganisation(user as unknown as UserWithOrganisations | null, organisationId)) {
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
                    onClick={() => setIsAssignOrgAdminDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Admins to Organisation
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!organisation?.admins?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admins assigned to this organisation.
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Admins assigned to this organisation.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Admin Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(organisation.admins ?? []).map((admin) => {
                        const adminName = `${admin.first_name} ${admin.last_name}`
                        return (
                          <TableRow key={admin.user_id}>
                            <TableCell className="font-medium">
                              <button
                                type="button"
                                className="text-primary hover:underline cursor-pointer font-medium"
                                disabled={isLoggingInAs}
                                onClick={() => handleLoginAsAdmin(admin.email, adminName)}
                              >
                                {adminName}
                              </button>
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {filterRolesFromApi(admin.roles ?? []).map((role) => (
                                  <Badge key={role} variant="secondary">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isLoggingInAs}
                                onClick={() => handleLoginAsAdmin(admin.email, adminName)}
                              >
                                <LogIn className="h-4 w-4 mr-2" />
                                Login As
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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
                              payment.status === "sent"
                                ? "default"
                                : payment.status === "draft"
                                ? "secondary"
                                : payment.status === "failed"
                                ? "destructive"
                                : "secondary"
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

      {/* Assign Admins to Organisation Dialog */}
      {organisation && (
        <Dialog open={isAssignOrgAdminDialogOpen} onOpenChange={setIsAssignOrgAdminDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Assign Admins to Organisation</DialogTitle>
              <DialogDescription>
                Select which admins can manage this organisation. Click Save when done.
              </DialogDescription>
            </DialogHeader>
            <AssignAdminDialog
              organisationId={organisation.id}
              currentAdmins={organisation.admins || []}
              onSuccess={handleAssignOrgAdminSuccess}
              onCancel={handleAssignOrgAdminCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
