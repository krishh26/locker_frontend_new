"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useSetOrganisationAdminsMutation } from "@/store/api/organisations/organisationApi"
import { useGetUsersByRoleQuery } from "@/store/api/user/userApi"
import type { AdminUser } from "@/store/api/organisations/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface AssignAdminDialogProps {
  organisationId: number
  currentAdmins?: AdminUser[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignAdminDialog({
  organisationId,
  currentAdmins = [],
  onSuccess,
  onCancel,
}: AssignAdminDialogProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersByRoleQuery("Admin")
  const [setOrganisationAdmins, { isLoading: isSaving }] = useSetOrganisationAdminsMutation()

  const allAdmins = usersData?.data || []
  const currentAdminIds = useMemo(
    () => currentAdmins.map((admin) => admin.user_id),
    [currentAdmins]
  )
  const [selectedAdminIds, setSelectedAdminIds] = useState<number[]>(currentAdminIds)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setSelectedAdminIds(currentAdminIds)
  }, [currentAdminIds])

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return allAdmins
    
    const query = searchQuery.toLowerCase()
    return allAdmins.filter(
      (admin) =>
        admin.first_name.toLowerCase().includes(query) ||
        admin.last_name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
    )
  }, [allAdmins, searchQuery])

  const handleToggleAdmin = (adminId: number) => {
    setSelectedAdminIds((prev) =>
      prev.includes(adminId)
        ? prev.filter((id) => id !== adminId)
        : [...prev, adminId]
    )
  }

  const hasChanges = useMemo(() => {
    if (selectedAdminIds.length !== currentAdminIds.length) return true
    const setCurrent = new Set(currentAdminIds)
    return selectedAdminIds.some((id) => !setCurrent.has(id))
  }, [selectedAdminIds, currentAdminIds])

  const handleSave = async () => {
    try {
      await setOrganisationAdmins({
        id: organisationId,
        user_ids: selectedAdminIds,
      }).unwrap()
      toast.success("Admins saved successfully")
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to save admins"
      toast.error(errorMessage)
    }
  }

  const isLoading = isLoadingUsers || isSaving

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
        <Label>Select Admins to assign</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {filteredAdmins.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? "No admins found matching your search" : "No admin users available"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAdmins.map((admin) => {
              const isSelected = selectedAdminIds.includes(admin.user_id)
              return (
                <div
                  key={admin.user_id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleAdmin(admin.user_id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleAdmin(admin.user_id)}
                    id={`admin-${admin.user_id}`}
                  />
                  <Label
                    htmlFor={`admin-${admin.user_id}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {admin.first_name} {admin.last_name}
                  </Label>
                  <span className="text-sm text-muted-foreground">{admin.email}</span>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {selectedAdminIds.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Admins ({selectedAdminIds.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedAdminIds.map((adminId) => {
              const admin = allAdmins.find((a) => a.user_id === adminId)
              if (!admin) return null
              return (
                <Badge
                  key={adminId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {admin.first_name} {admin.last_name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleAdmin(adminId)
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  )
}
