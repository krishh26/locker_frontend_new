"use client"

import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { filterRolesFromApi } from "@/config/auth-roles"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin, type UserWithOrganisations } from "@/utils/permissions"
import {
  useGetCentreQuery,
  useActivateCentreMutation,
  useSuspendCentreMutation,
} from "@/store/api/centres/centreApi"
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
import { MapPin, Building2, Users, Edit, CheckCircle, XCircle, Plus } from "lucide-react"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import { EditCentreForm } from "../components/edit-centre-form"
import { AssignAdminDialog } from "../components/assign-admin-dialog"

export default function CentreDetailPage() {
  const t = useTranslations("centres.detail")
  const params = useParams()
  const router = useRouter()
  const centreId = Number(params.centreId)
  const user = useAppSelector(selectAuthUser)

  const { data: centreData, isLoading: isLoadingCentre, refetch: refetchCentre } = useGetCentreQuery(centreId)
  const [activateCentre, { isLoading: isActivating }] = useActivateCentreMutation()
  const [suspendCentre, { isLoading: isSuspending }] = useSuspendCentreMutation()

  const centre = centreData?.data
  const organisation = centre?.organisation
  const assignedAdmins = centre?.admins || []

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignAdminDialogOpen, setIsAssignAdminDialogOpen] = useState(false)
  const canEdit = isMasterAdmin(user as unknown as UserWithOrganisations | null)

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false)
    refetchCentre()
  }, [refetchCentre])

  const handleEditCancel = useCallback(() => {
    setIsEditDialogOpen(false)
  }, [])

  const handleActivate = useCallback(async () => {
    if (!centre) return
    try {
      await activateCentre(centre.id).unwrap()
      toast.success(t("toastActivated"))
      refetchCentre()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastActivateFailed")
      toast.error(errorMessage)
    }
  }, [centre, activateCentre, refetchCentre, t])

  const handleSuspend = useCallback(async () => {
    if (!centre) return
    try {
      await suspendCentre(centre.id).unwrap()
      toast.success(t("toastSuspended"))
      refetchCentre()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toastSuspendFailed")
      toast.error(errorMessage)
    }
  }, [centre, suspendCentre, refetchCentre, t])

  const handleAssignAdminSuccess = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
    refetchCentre()
  }, [refetchCentre])

  const handleAssignAdminCancel = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
  }, [])

  const isAPILoading = isLoadingCentre

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

  if (!centre) {
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
          title={centre.name}
          showBackButton
          subtitle={`${t("centreId")}: ${centre.id}`}
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
            {centre.status === "suspended" ? (
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
          <TabsTrigger value="admins">{t("admins")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t("centreDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">{t("name")}:</span>
                  <p className="text-sm text-muted-foreground">{centre.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("status")}:</span>
                  <div className="mt-1">
                    <Badge
                      variant={centre.status === "active" ? "default" : "destructive"}
                    >
                      {centre.status === "active" ? t("active") : t("suspended")}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">{t("id")}:</span>
                  <p className="text-sm text-muted-foreground">{centre.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("organisation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {organisation ? (
                  <>
                    <div>
                      <span className="text-sm font-medium">{t("name")}:</span>
                      <Button
                        variant="link"
                        className="h-auto p-0 font-normal"
                        onClick={() => router.push(`/organisations/${organisation.id}`)}
                      >
                        {organisation.name}
                      </Button>
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
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("organisationNotFound")}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t("centreAdmins")}
                </CardTitle>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => setIsAssignAdminDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("assignAdmin")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedAdmins.length === 0 ? (
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
                        <TableHead>{t("name")}</TableHead>
                        <TableHead>{t("email")}</TableHead>
                        <TableHead>{t("roles")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedAdmins.map((admin) => (
                        <TableRow key={admin.user_id}>
                          <TableCell className="font-medium">
                            {admin.first_name} {admin.last_name}
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Centre Dialog */}
      {centre && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("editCentre")}</DialogTitle>
              <DialogDescription>
                {t("editCentreDescription")}
              </DialogDescription>
            </DialogHeader>
            <EditCentreForm
              centre={centre}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Admin Dialog */}
      {centre && (
        <Dialog open={isAssignAdminDialogOpen} onOpenChange={setIsAssignAdminDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("assignAdminsTitle")}</DialogTitle>
              <DialogDescription>
                {t("assignAdminsDescription")}
              </DialogDescription>
            </DialogHeader>
            <AssignAdminDialog
              centreId={centre.id}
              currentAdmins={assignedAdmins}
              onSuccess={handleAssignAdminSuccess}
              onCancel={handleAssignAdminCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
