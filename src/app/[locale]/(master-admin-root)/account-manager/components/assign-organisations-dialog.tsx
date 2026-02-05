"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useAssignOrganisationsMutation,
  useGetAssignedOrganisationsQuery,
} from "@/store/api/account-manager/accountManagerApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import type { AccountManager } from "@/store/api/account-manager/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface AssignOrganisationsDialogProps {
  accountManager: AccountManager
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignOrganisationsDialog({
  accountManager,
  onSuccess,
  onCancel,
}: AssignOrganisationsDialogProps) {
  const { data: organisationsData, isLoading: isLoadingOrgs } = useGetOrganisationsQuery()
  const { data: assignedData, isLoading: isLoadingAssigned } = useGetAssignedOrganisationsQuery(
    accountManager.id
  )
  const [assignOrganisations, { isLoading: isAssigning }] = useAssignOrganisationsMutation()

  const organisations = organisationsData?.data ?? []
  const assignedOrgIds = assignedData?.data ?? accountManager.assignedOrganisationIds
  const [selectedOrgIds, setSelectedOrgIds] = useState<number[]>(assignedOrgIds)

  // Show only active orgs as assignable; keep already-assigned orgs (including suspended) visible
  const displayList = useMemo(() => {
    const list = organisationsData?.data ?? []
    const assignedSet = new Set(assignedOrgIds)
    const assignedOrgs = list.filter((o) => assignedSet.has(o.id))
    const activeNotAssigned = list.filter(
      (o) => o.status === "active" && !assignedSet.has(o.id)
    )
    return [...assignedOrgs, ...activeNotAssigned]
  }, [organisationsData?.data, assignedOrgIds])

  useEffect(() => {
    if (assignedOrgIds.length > 0) {
      setSelectedOrgIds(assignedOrgIds)
    }
  }, [assignedOrgIds])

  const handleToggleOrg = (orgId: number) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    )
  }

  const handleSubmit = async () => {
    try {
      await assignOrganisations({
        accountManagerId: accountManager.id,
        organisationIds: selectedOrgIds,
      }).unwrap()
      toast.success("Organisations assigned successfully")
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to assign organisations"
      toast.error(errorMessage)
    }
  }

  const isLoading = isLoadingOrgs || isLoadingAssigned || isAssigning
  const hasChanges = JSON.stringify([...selectedOrgIds].sort()) !== JSON.stringify([...assignedOrgIds].sort())

  if (isLoadingOrgs || isLoadingAssigned) {
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
        <Label>Select Organisations</Label>
        <p className="text-sm text-muted-foreground">
          Choose which organisations this account manager can access.
        </p>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {displayList.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No organisations available
          </div>
        ) : (
          <div className="space-y-3">
            {displayList.map((org) => {
              const isSelected = selectedOrgIds.includes(org.id)
              return (
                <div
                  key={org.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleOrg(org.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleOrg(org.id)}
                    id={`org-${org.id}`}
                  />
                  <Label
                    htmlFor={`org-${org.id}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {org.name}
                  </Label>
                  <Badge variant={org.status === "active" ? "default" : "secondary"}>
                    {org.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {selectedOrgIds.length > 0 && (
        <div className="space-y-2">
          <Label>Selected ({selectedOrgIds.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedOrgIds.map((orgId) => {
              const org = displayList.find((o) => o.id === orgId) ?? organisations.find((o) => o.id === orgId)
              if (!org) return null
              return (
                <Badge key={orgId} variant="secondary" className="flex items-center gap-1">
                  {org.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleOrg(orgId)
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
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges}
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Assignments
        </Button>
      </div>
    </div>
  )
}
