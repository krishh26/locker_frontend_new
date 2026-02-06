"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAssignPlanToOrganisationMutation,
  useGetPlansQuery,
  useGetSubscriptionsQuery,
} from "@/store/api/subscriptions/subscriptionApi"
import { useGetOrganisationsQuery } from "@/store/api/organisations/organisationApi"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface AssignPlanDialogProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignPlanDialog({ onSuccess, onCancel }: AssignPlanDialogProps) {
  const { data: orgsData, isLoading: isLoadingOrgs } = useGetOrganisationsQuery({
    status: "active",
    page: 1,
    limit: 500,
    meta: "true",
  })
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery()
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useGetSubscriptionsQuery()
  const [assignPlanMutation, { isLoading: isAssigning }] = useAssignPlanToOrganisationMutation()

  const [organisationId, setOrganisationId] = useState<string>("")
  const [planId, setPlanId] = useState<string>("")

  // Get organisation IDs that already have a subscription/plan
  const orgsWithPlan = useMemo(() => {
    const subscriptions = subscriptionsData?.data ?? []
    return new Set(subscriptions.map((s) => s.organisationId))
  }, [subscriptionsData])

  // Filter out organisations that already have a plan assigned
  const organisations = useMemo(() => {
    const allOrgs = orgsData?.data ?? []
    return allOrgs.filter((org) => !orgsWithPlan.has(org.id))
  }, [orgsData, orgsWithPlan])

  const plans = (plansData?.data ?? []).filter((p) => p.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organisationId || !planId) {
      toast.error("Please select organisation and plan")
      return
    }
    try {
      await assignPlanMutation({
        organisationId: Number(organisationId),
        planId: Number(planId),
      }).unwrap()
      toast.success("Plan assigned successfully")
      setOrganisationId("")
      setPlanId("")
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : "Failed to assign plan"
      toast.error(msg)
    }
  }

  const isLoading = isLoadingOrgs || isLoadingPlans || isLoadingSubscriptions

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  // Show message if no organisations available
  if (organisations.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-center py-4">
          All active organisations already have a plan assigned.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Organisation *</Label>
        <Select value={organisationId} onValueChange={setOrganisationId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select organisation" />
          </SelectTrigger>
          <SelectContent>
            {organisations.map((org) => (
              <SelectItem key={org.id} value={String(org.id)}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only organisations without a plan are shown.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Plan *</Label>
        <Select value={planId} onValueChange={setPlanId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {plan.name} ({plan.code}) - {plan.currency} {plan.price}/{plan.billingCycle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isAssigning}>
          Cancel
        </Button>
        <Button type="submit" disabled={isAssigning || !organisationId || !planId}>
          {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assign Plan
        </Button>
      </div>
    </form>
  )
}
