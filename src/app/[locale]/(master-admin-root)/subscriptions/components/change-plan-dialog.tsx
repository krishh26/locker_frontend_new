"use client"

import { useState, useEffect } from "react"
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
import { useChangeOrganisationPlanMutation } from "@/store/api/subscriptions/subscriptionApi"
import { useGetPlansQuery } from "@/store/api/subscriptions/subscriptionApi"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"

interface ChangePlanDialogProps {
  organisationId: number
  organisationName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChangePlanDialog({
  organisationId,
  organisationName,
  onSuccess,
  onCancel,
}: ChangePlanDialogProps) {
  const t = useTranslations("subscriptions")
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery()
  const [changePlanMutation, { isLoading: isChanging }] = useChangeOrganisationPlanMutation()

  const [planId, setPlanId] = useState<string>("")

  const plans = (plansData?.data ?? []).filter((p) => p.isActive)

  useEffect(() => {
    setPlanId("")
  }, [organisationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planId) {
      toast.error(t("changePlan.toast.selectPlan"))
      return
    }
    try {
      await changePlanMutation({
        organisationId,
        planId: Number(planId),
      }).unwrap()
      toast.success(t("changePlan.toast.changedSuccess"))
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : t("changePlan.toast.changeFailedFallback")
      toast.error(msg)
    }
  }

  if (isLoadingPlans) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {organisationName && (
        <div className="space-y-2">
          <Label>{t("changePlan.labels.organisation")}</Label>
          <p className="text-sm font-medium">{organisationName}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label>{t("changePlan.labels.newPlan")}</Label>
        <Select value={planId} onValueChange={setPlanId} required>
          <SelectTrigger>
            <SelectValue placeholder={t("changePlan.placeholders.plan")} />
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isChanging}>
          {t("changePlan.buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isChanging || !planId}>
          {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("changePlan.buttons.submit")}
        </Button>
      </div>
    </form>
  )
}
