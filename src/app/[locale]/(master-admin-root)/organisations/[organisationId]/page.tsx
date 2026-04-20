"use client"

import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { filterRolesFromApi } from "@/config/auth-roles"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import {
  setMasterAdminOrganisationId,
  clearMasterAdminOrganisationId,
} from "@/store/slices/orgContextSlice"
import { canAccessOrganisation, isMasterAdmin, type UserWithOrganisations } from "@/utils/permissions"
import {
  useGetOrganisationQuery,
  useActivateOrganisationMutation,
  useSuspendOrganisationMutation,
} from "@/store/api/organisations/organisationApi"
import { useGetTokenByEmailMutation } from "@/store/api/auth/authApi"
import { useGetSubscriptionsQuery } from "@/store/api/subscriptions/subscriptionApi"
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
import { Building2, MapPin, CreditCard, DollarSign, Users, Edit, CheckCircle, XCircle, Plus, LogIn, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useEffect, useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { EditOrganisationForm } from "../components/edit-organisation-form"
import { AssignAdminDialog } from "../components/assign-admin-dialog"

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

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
}

export default function OrganisationDetailPage() {
  const t = useTranslations("organisations.detail")
  const ts = useTranslations("subscriptions")
  const params = useParams()
  const router = useRouter()
  const organisationId = Number(params.organisationId)
  const user = useAppSelector(selectAuthUser)

  // Check access before rendering
  useEffect(() => {
    if (!canAccessOrganisation(user as unknown as UserWithOrganisations | null, organisationId)) {
      router.push("/errors/unauthorized")
    }
  }, [user, organisationId, router])

  const dispatch = useAppDispatch()
  // Clear org context when leaving this page
  useEffect(() => {
    return () => {
      dispatch(clearMasterAdminOrganisationId())
    }
  }, [dispatch])

  const { data: orgData, isLoading: isLoadingOrg, refetch: refetchOrg } = useGetOrganisationQuery(organisationId)
  const { data: subscriptionsData, isLoading: isLoadingSubscription } = useGetSubscriptionsQuery()
  const { data: paymentsData, isLoading: isLoadingPayments } = useGetPaymentsQuery({ organisationId })
  const [activateOrganisation, { isLoading: isActivating }] = useActivateOrganisationMutation()
  const [suspendOrganisation, { isLoading: isSuspending }] = useSuspendOrganisationMutation()
  const [getTokenByEmail, { isLoading: isLoggingInAs }] = useGetTokenByEmailMutation()

  const organisation = orgData?.data
  const centres = organisation?.centres ?? []
  const subscription = useMemo(
    () => (subscriptionsData?.data ?? []).find((s) => s.organisationId === organisationId),
    [subscriptionsData?.data, organisationId],
  )
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
      toast.success(t("toastActivated"))
      refetchOrg()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate organisation"
      toast.error(errorMessage || t("toastActivateFailed"))
    }
  }, [organisation, activateOrganisation, t, refetchOrg])

  const handleSuspend = useCallback(async () => {
    if (!organisation) return
    try {
      await suspendOrganisation(organisation.id).unwrap()
      toast.success(t("toastSuspended"))
      refetchOrg()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to suspend organisation"
      toast.error(errorMessage || t("toastSuspendFailed"))
    }
  }, [organisation, suspendOrganisation, t, refetchOrg])

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
      if (Number.isFinite(organisationId) && organisationId > 0) {
        dispatch(setMasterAdminOrganisationId(organisationId))
      }
      window.open(`/auth/impersonate?key=${key}`, "_blank")
      toast.success(t("toastLoginAs", { name: adminName }))
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to login as admin"
      toast.error(errorMessage || t("toastLoginAsFailed"))
    }
  }, [getTokenByEmail, organisationId, dispatch, t])

  if (!canAccessOrganisation(user as unknown as UserWithOrganisations | null, organisationId)) {
    return null // Will redirect in useEffect
  }

  // Show loading state while fetching organisation data
  if (isAPILoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader title={t("loading")} />
        <div className="text-center py-8 text-muted-foreground">
          {t("loadingDetails")}
        </div>
      </div>
    )
  }

  if (!organisation) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader title={t("notFound")} />
        <div className="text-center py-8 text-muted-foreground">
          {t("notFoundDescription")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={organisation.name}
          subtitle={`${t("organisationId")}: ${organisation.id}`}
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
              {t("edit")}
            </Button>
            {organisation.status === "suspended" ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleActivate}
                disabled={isActivating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("activate")}
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSuspend}
                disabled={isSuspending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t("suspend")}
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="centres">{t("centres")}</TabsTrigger>
          <TabsTrigger value="admins">{t("admins")}</TabsTrigger>
          <TabsTrigger value="subscription">{t("subscription")}</TabsTrigger>
          <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("organisationDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">{t("name")}:</span>
                  <p className="text-sm text-muted-foreground">{organisation.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("status")}:</span>
                  <div className="mt-1">
                    <Badge
                      variant={organisation.status === "active" ? "default" : "destructive"}
                    >
                      {organisation.status === "active" ? t("active") : t("suspended")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("id")}:</span>
                  <p className="text-sm text-muted-foreground">{organisation.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("quickStats")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">{t("totalCentres")}:</span>
                  <p className="text-sm text-muted-foreground">{centres.length}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("activeCentres")}:</span>
                  <p className="text-sm text-muted-foreground">
                    {centres.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("totalPayments")}:</span>
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
                {t("centres")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {centres.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noCentres")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
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
                            {centre.status === "active" ? t("active") : t("disabled")}
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
                  {t("organisationAdmins")}
                </CardTitle>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => setIsAssignOrgAdminDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("assignAdmins")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!organisation?.admins?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noAdmins")}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("adminsAssignedDescription")}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("adminName")}</TableHead>
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("roles")}</TableHead>
                        <TableHead>{t("actions")}</TableHead>
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
                                {t("loginAs")}
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
                {t("subscriptionDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div>
                    <span className="text-sm font-medium">{t("plan")}:</span>
                    <p className="text-sm text-muted-foreground">{subscription.plan}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{ts("subscriptionsTable.columns.users")}:</span>
                    <p className="text-sm text-muted-foreground">
                      {subscription.usedLicenses ?? subscription.usedUsers} /{" "}
                      {subscription.totalLicenses ?? subscription.userLimit}{" "}
                      <span className="text-muted-foreground">
                        ({ts("subscriptionsTable.licensesRemaining", { count: subscription.remainingLicenses ?? Math.max(0, (subscription.maxAllowedLicenses ?? subscription.userLimit) - (subscription.usedLicenses ?? subscription.usedUsers)) })})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t("status")}:</span>
                    <div className="mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={subscription.isExpired ? "destructive" : "default"}>
                          {subscription.isExpired ? t("expired") : t("active")}
                        </Badge>
                        {(() => {
                          const health = computeLicenseHealth(subscription)
                          const badgeVariant =
                            health === "crossed"
                              ? "destructive"
                              : health === "warning"
                                ? "secondary"
                                : "outline"
                          const BadgeIcon =
                            health === "crossed"
                              ? CheckCircle2
                              : health === "warning"
                                ? AlertTriangle
                                : null
                          return (
                            <Badge variant={badgeVariant}>
                              {BadgeIcon ? <BadgeIcon className="h-3 w-3" /> : null}
                              {ts(`subscriptionsTable.licenseHealth.${health}` as "subscriptionsTable.licenseHealth.ok")}
                            </Badge>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t("expiryDate")}:</span>
                    <p className="text-sm text-muted-foreground">{formatDate(subscription.endDate ?? subscription.expiryDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">{ts("subscriptionsTable.columns.startDate")}:</span>
                    <p className="text-sm text-muted-foreground">{formatDate(subscription.startDate)}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noSubscription")}
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
                {t("paymentHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("noPaymentHistory")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("date")}</TableHead>
                      <TableHead>{t("amount")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("invoice")}</TableHead>
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
              <DialogTitle>{t("editOrganisation")}</DialogTitle>
              <DialogDescription>
                {t("editOrganisationDescription")}
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
              <DialogTitle>{t("assignAdminsTitle")}</DialogTitle>
              <DialogDescription>
                {t("assignAdminsDescription")}
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
