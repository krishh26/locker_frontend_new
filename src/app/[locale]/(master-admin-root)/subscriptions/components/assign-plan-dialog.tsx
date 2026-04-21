"use client"

import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useTranslations } from "next-intl"

interface AssignPlanDialogProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignPlanDialog({ onSuccess, onCancel }: AssignPlanDialogProps) {
  const t = useTranslations("subscriptions")
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
  const [totalLicenses, setTotalLicenses] = useState<string>("")
  const [tolerancePercentage, setTolerancePercentage] = useState<string>("")
  const [warningThresholdPercentage, setWarningThresholdPercentage] = useState<string>("")

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
      toast.error(t("assignPlan.toast.selectOrgAndPlan"))
      return
    }

    const totalLicensesNum = Number(totalLicenses)
    if (!Number.isInteger(totalLicensesNum) || totalLicensesNum < 1) {
      toast.error(t("assignPlan.toast.invalidTotalLicenses"))
      return
    }

    const tolerancePercentageNum = Number(tolerancePercentage)
    if (!Number.isFinite(tolerancePercentageNum) || tolerancePercentageNum < 0 || tolerancePercentageNum > 100) {
      toast.error(t("assignPlan.toast.invalidTolerancePercentage"))
      return
    }

    const warningThresholdPercentageNum = Number(warningThresholdPercentage)
    if (
      !Number.isFinite(warningThresholdPercentageNum) ||
      warningThresholdPercentageNum < 0 ||
      warningThresholdPercentageNum > 100
    ) {
      toast.error(t("assignPlan.toast.invalidWarningThresholdPercentage"))
      return
    }

    try {
      await assignPlanMutation({
        organisationId: Number(organisationId),
        planId: Number(planId),
        totalLicenses: totalLicensesNum,
        tolerancePercentage: tolerancePercentageNum,
        warningThresholdPercentage: warningThresholdPercentageNum,
      }).unwrap()
      toast.success(t("assignPlan.toast.assignedSuccess"))
      setOrganisationId("")
      setPlanId("")
      setTotalLicenses("")
      setTolerancePercentage("")
      setWarningThresholdPercentage("")
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : t("assignPlan.toast.assignFailedFallback")
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
          {t("assignPlan.empty.allAssigned")}
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("assignPlan.buttons.close")}
          </Button>
        </div>
      </div>
    )
  }

  const totalLicensesNumForUi = Number(totalLicenses)
  const tolerancePercentageNumForUi = Number(tolerancePercentage)
  const warningThresholdPercentageNumForUi = Number(warningThresholdPercentage)

  const isTotalLicensesValid =
    totalLicenses !== "" && Number.isInteger(totalLicensesNumForUi) && totalLicensesNumForUi >= 1
  const isTolerancePercentageValid =
    tolerancePercentage !== "" &&
    Number.isFinite(tolerancePercentageNumForUi) &&
    tolerancePercentageNumForUi >= 0 &&
    tolerancePercentageNumForUi <= 100
  const isWarningThresholdPercentageValid =
    warningThresholdPercentage !== "" &&
    Number.isFinite(warningThresholdPercentageNumForUi) &&
    warningThresholdPercentageNumForUi >= 0 &&
    warningThresholdPercentageNumForUi <= 100

  const isFormValid =
    !!organisationId &&
    !!planId &&
    isTotalLicensesValid &&
    isTolerancePercentageValid &&
    isWarningThresholdPercentageValid

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>{t("assignPlan.labels.organisation")}</Label>
        <Select value={organisationId} onValueChange={setOrganisationId} required>
          <SelectTrigger>
            <SelectValue placeholder={t("assignPlan.placeholders.organisation")} />
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
          {t("assignPlan.helper.orgsWithoutPlanOnly")}
        </p>
      </div>
      <div className="space-y-2">
        <Label>{t("assignPlan.labels.plan")}</Label>
        <Select value={planId} onValueChange={setPlanId} required>
          <SelectTrigger>
            <SelectValue placeholder={t("assignPlan.placeholders.plan")} />
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
      <div className="space-y-2">
        <Label htmlFor="totalLicenses">{t("assignPlan.labels.totalLicenses")}</Label>
        <Input
          id="totalLicenses"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder={t("assignPlan.placeholders.totalLicenses")}
          value={totalLicenses}
          onChange={(e) => setTotalLicenses(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tolerancePercentage">{t("assignPlan.labels.tolerancePercentage")}</Label>
        <Input
          id="tolerancePercentage"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.01}
          placeholder={t("assignPlan.placeholders.tolerancePercentage")}
          value={tolerancePercentage}
          onChange={(e) => setTolerancePercentage(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="warningThresholdPercentage">
          {t("assignPlan.labels.warningThresholdPercentage")}
        </Label>
        <Input
          id="warningThresholdPercentage"
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step={0.01}
          placeholder={t("assignPlan.placeholders.warningThresholdPercentage")}
          value={warningThresholdPercentage}
          onChange={(e) => setWarningThresholdPercentage(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isAssigning}>
          {t("assignPlan.buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isAssigning || !isFormValid}>
          {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("assignPlan.buttons.submit")}
        </Button>
      </div>
    </form>
  )
}
