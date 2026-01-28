"use client"

import { useState, useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useAssignAdminToCentreMutation,
  useRemoveAdminFromCentreMutation,
} from "@/store/api/centres/centreApi"
import { useGetUsersByRoleQuery } from "@/store/api/user/userApi"
import type { AdminUser } from "@/store/api/centres/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface AssignAdminDialogProps {
  centreId: number
  currentAdmins?: AdminUser[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignAdminDialog({
  centreId,
  currentAdmins = [],
  onSuccess,
  onCancel,
}: AssignAdminDialogProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersByRoleQuery("Admin")
  const [assignAdmin, { isLoading: isAssigning }] = useAssignAdminToCentreMutation()
  const [removeAdmin, { isLoading: isRemoving }] = useRemoveAdminFromCentreMutation()

  const allAdmins = usersData?.data || []
  const currentAdminIds = currentAdmins.map((admin) => admin.user_id)
  const [selectedAdminIds, setSelectedAdminIds] = useState<number[]>(currentAdminIds)
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setSelectedAdminIds(currentAdminIds)
  }, [currentAdminIds])

  const handleToggleAdmin = async (adminId: number) => {
    const isCurrentlySelected = selectedAdminIds.includes(adminId)
    setProcessingIds((prev) => new Set(prev).add(adminId))

    try {
      if (isCurrentlySelected) {
        // Remove admin
        await removeAdmin({ id: centreId, user_id: adminId }).unwrap()
        setSelectedAdminIds((prev) => prev.filter((id) => id !== adminId))
        toast.success("Admin removed successfully")
      } else {
        // Assign admin
        await assignAdmin({ id: centreId, user_id: adminId }).unwrap()
        setSelectedAdminIds((prev) => [...prev, adminId])
        toast.success("Admin assigned successfully")
      }
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : isCurrentlySelected
          ? "Failed to remove admin"
          : "Failed to assign admin"
      toast.error(errorMessage)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(adminId)
        return next
      })
    }
  }

  const isLoading = isLoadingUsers || isAssigning || isRemoving

  if (isLoadingUsers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Select Admins</Label>
        <p className="text-sm text-muted-foreground">
          Choose which admins can manage this centre. Click to assign or remove.
        </p>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {allAdmins.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No admin users available
          </div>
        ) : (
          <div className="space-y-3">
            {allAdmins.map((admin) => {
              const isSelected = selectedAdminIds.includes(admin.user_id)
              const isProcessing = processingIds.has(admin.user_id)
              return (
                <div
                  key={admin.user_id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => !isProcessing && handleToggleAdmin(admin.user_id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !isProcessing && handleToggleAdmin(admin.user_id)}
                    id={`admin-${admin.user_id}`}
                    disabled={isProcessing}
                  />
                  <Label
                    htmlFor={`admin-${admin.user_id}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {admin.first_name} {admin.last_name}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{admin.email}</span>
                    {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {selectedAdminIds.length > 0 && (
        <div className="space-y-2">
          <Label>Assigned Admins ({selectedAdminIds.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedAdminIds.map((adminId) => {
              const admin = allAdmins.find((a) => a.user_id === adminId)
              if (!admin) return null
              const isProcessing = processingIds.has(adminId)
              return (
                <Badge
                  key={adminId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {admin.first_name} {admin.last_name}
                  {!isProcessing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleAdmin(adminId)
                      }}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Close
        </Button>
      </div>
    </div>
  )
}
