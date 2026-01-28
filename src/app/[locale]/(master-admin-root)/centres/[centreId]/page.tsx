"use client"

import { useParams, useRouter } from "next/navigation"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import {
  useGetCentreQuery,
  useActivateCentreMutation,
  useSuspendCentreMutation,
} from "@/store/api/centres/centreApi"
import { useGetOrganisationQuery } from "@/store/api/organisations/organisationApi"
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
  const params = useParams()
  const router = useRouter()
  const centreId = Number(params.centreId)
  const user = useAppSelector(selectAuthUser)

  const { data: centreData, isLoading: isLoadingCentre, refetch: refetchCentre } = useGetCentreQuery(centreId)
  const { data: orgData, isLoading: isLoadingOrg } = useGetOrganisationQuery(
    centreData?.data?.organisationId || 0,
    { skip: !centreData?.data?.organisationId }
  )
  const [activateCentre, { isLoading: isActivating }] = useActivateCentreMutation()
  const [suspendCentre, { isLoading: isSuspending }] = useSuspendCentreMutation()

  const centre = centreData?.data
  const organisation = orgData?.data
  const assignedAdmins = centre?.admins || []

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignAdminDialogOpen, setIsAssignAdminDialogOpen] = useState(false)
  const canEdit = isMasterAdmin(user)

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
      toast.success("Centre activated successfully")
      refetchCentre()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to activate centre"
      toast.error(errorMessage)
    }
  }, [centre, activateCentre, refetchCentre])

  const handleSuspend = useCallback(async () => {
    if (!centre) return
    try {
      await suspendCentre(centre.id).unwrap()
      toast.success("Centre suspended successfully")
      refetchCentre()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to suspend centre"
      toast.error(errorMessage)
    }
  }, [centre, suspendCentre, refetchCentre])

  const handleAssignAdminSuccess = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
    refetchCentre()
  }, [refetchCentre])

  const handleAssignAdminCancel = useCallback(() => {
    setIsAssignAdminDialogOpen(false)
  }, [])

  const isAPILoading = isLoadingCentre || isLoadingOrg || isLoadingOrg

  if (isAPILoading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Loading..." />
        <div className="text-center py-8 text-muted-foreground">
          Loading centre details...
        </div>
      </div>
    )
  }

  if (!centre) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Centre Not Found" />
        <div className="text-center py-8 text-muted-foreground">
          The centre you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <PageHeader
          title={centre.name}
          subtitle={`Centre ID: ${centre.id}`}
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
            {centre.status === "suspended" ? (
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
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Centre Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Name:</span>
                  <p className="text-sm text-muted-foreground">{centre.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant={centre.status === "active" ? "default" : "destructive"}
                    >
                      {centre.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">ID:</span>
                  <p className="text-sm text-muted-foreground">{centre.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {organisation ? (
                  <>
                    <div>
                      <span className="text-sm font-medium">Name:</span>
                      <Button
                        variant="link"
                        className="h-auto p-0 font-normal"
                        onClick={() => router.push(`/organisations/${organisation.id}`)}
                      >
                        {organisation.name}
                      </Button>
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
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Organisation not found</p>
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
                  Centre Admins
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
              {isLoadingOrg ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading admins...
                </div>
              ) : assignedAdmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No admins assigned to this centre. Click &quot;Assign Admin&quot; to add admins.
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Admins assigned to this centre can manage it.
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
                      {assignedAdmins.map((admin) => (
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
      </Tabs>

      {/* Edit Centre Dialog */}
      {centre && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Centre</DialogTitle>
              <DialogDescription>
                Update centre details. Only MasterAdmin can edit centres.
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
              <DialogTitle>Assign Admins to Centre</DialogTitle>
              <DialogDescription>
                Select which admins can manage this centre. Click to assign or remove.
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
