"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { useMapFeatureToPlanMutation } from "@/store/api/feature-control/featureControlApi"
import { useGetPlansQuery } from "@/store/api/subscriptions/subscriptionApi"
import type { Feature } from "@/store/api/feature-control/types"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface MapFeatureToPlanDialogProps {
  feature: Feature
  onSuccess?: () => void
  onCancel?: () => void
}

export function MapFeatureToPlanDialog({
  feature,
  onSuccess,
  onCancel,
}: MapFeatureToPlanDialogProps) {
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery()
  const [mapFeatureToPlan, { isLoading: isMapping }] = useMapFeatureToPlanMutation()

  const plans = plansData?.data || []
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [enabled, setEnabled] = useState(true)

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a plan")
      return
    }

    try {
      await mapFeatureToPlan({
        featureId: feature.id,
        planId: parseInt(selectedPlanId, 10),
        enabled,
      }).unwrap()
      toast.success(`Feature ${enabled ? "mapped to" : "unmapped from"} plan successfully`)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to map feature to plan"
      toast.error(errorMessage)
    }
  }

  const isLoading = isLoadingPlans || isMapping

  if (isLoadingPlans) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Feature</Label>
        <div className="p-3 bg-muted rounded-md">
          <div className="font-medium">{feature.name}</div>
          <div className="text-sm text-muted-foreground">{feature.code}</div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">
          Plan <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedPlanId} onValueChange={setSelectedPlanId} disabled={isLoading}>
          <SelectTrigger id="plan">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plans.length === 0 ? (
              <SelectItem value="no-plans" disabled>
                No plans available
              </SelectItem>
            ) : (
              plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id.toString()}>
                  {plan.name} ({plan.code})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between space-x-2 p-4 border rounded-md">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Enable Feature</Label>
          <p className="text-sm text-muted-foreground">
            Enable or disable this feature for the selected plan
          </p>
        </div>
        <Switch
          id="enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
          disabled={isLoading}
        />
      </div>

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
          disabled={isLoading || !selectedPlanId}
          className="w-full sm:w-auto"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {enabled ? "Map Feature" : "Unmap Feature"}
        </Button>
      </div>
    </div>
  )
}
