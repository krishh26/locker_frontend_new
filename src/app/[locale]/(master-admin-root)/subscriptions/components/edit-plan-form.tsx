"use client"

import { useEffect, useMemo } from "react"
import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdatePlanMutation } from "@/store/api/subscriptions/subscriptionApi"
import type { Plan, UpdatePlanRequest } from "@/store/api/subscriptions/types"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface EditPlanFormValues {
  name: string
  description?: string
  price: number
  currency: string
  billingCycle: "monthly" | "yearly"
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  featuresStr?: string
}

interface EditPlanFormProps {
  plan: Plan
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditPlanForm({ plan, onSuccess, onCancel }: EditPlanFormProps) {
  const t = useTranslations("subscriptions")
  const [updatePlan, { isLoading }] = useUpdatePlanMutation()

  const editPlanSchema = useMemo(() => {
    return z.object({
      name: z.string().min(1, t("validation.nameRequired")),
      description: z.string().optional(),
      price: z.coerce.number().min(0, t("validation.priceMin0")),
      currency: z.string().min(1, t("validation.currencyRequired")),
      billingCycle: z.enum(["monthly", "yearly"]),
      userLimit: z.optional(z.coerce.number().min(0)),
      centreLimit: z.optional(z.coerce.number().min(0)),
      organisationLimit: z.optional(z.coerce.number().min(0)),
      featuresStr: z.string().optional(),
    })
  }, [t])

  const form = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanSchema) as unknown as Resolver<EditPlanFormValues>,
    defaultValues: {
      name: plan.name,
      description: plan.description ?? "",
      price: plan.price,
      currency: plan.currency ?? "GBP",
      billingCycle: plan.billingCycle ?? "monthly",
      userLimit: plan.userLimit,
      centreLimit: plan.centreLimit,
      organisationLimit: plan.organisationLimit,
      featuresStr: Array.isArray(plan.features) ? plan.features.join(", ") : "",
    },
  })

  useEffect(() => {
    form.reset({
      name: plan.name,
      description: plan.description ?? "",
      price: plan.price,
      currency: plan.currency ?? "GBP",
      billingCycle: plan.billingCycle ?? "monthly",
      userLimit: plan.userLimit ?? undefined,
      centreLimit: plan.centreLimit ?? undefined,
      organisationLimit: plan.organisationLimit ?? undefined,
      featuresStr: Array.isArray(plan.features) ? plan.features.join(", ") : "",
    })
  }, [plan, form])

  const onSubmit = async (values: EditPlanFormValues) => {
    try {
      const features = values.featuresStr
        ? values.featuresStr.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined
      const body: UpdatePlanRequest = {
        name: values.name,
        description: values.description || undefined,
        price: values.price,
        currency: values.currency,
        billingCycle: values.billingCycle,
        userLimit: values.userLimit,
        centreLimit: values.centreLimit,
        organisationLimit: values.organisationLimit,
        features,
      }
      await updatePlan({ id: plan.id, data: body }).unwrap()
      toast.success(t("form.toast.updatedSuccess"))
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : t("form.toast.updateFailedFallback")
      toast.error(msg)
    }
  }

  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>{t("form.labels.codeReadonly")}</Label>
        <Input value={plan.code} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">{t("form.help.codeCannotChange")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("form.labels.name")}</Label>
        <Input
          id="name"
          {...form.register("name")}
          className={form.formState.errors.name ? "border-destructive" : ""}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("form.labels.description")}</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">{t("form.labels.price")}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min={0}
            {...form.register("price")}
            className={form.formState.errors.price ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {form.formState.errors.price && (
            <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{t("form.labels.currency")}</Label>
          <Controller
            name="currency"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger id="currency" className={form.formState.errors.currency ? "border-destructive" : ""}>
                  <SelectValue placeholder={t("form.placeholders.currency")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.currency && (
            <p className="text-sm text-destructive">{form.formState.errors.currency.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("form.labels.billingCycle")}</Label>
        <Controller
          name="billingCycle"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
              <SelectTrigger className={form.formState.errors.billingCycle ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t("form.billingCycle.monthly")}</SelectItem>
                <SelectItem value="yearly">{t("form.billingCycle.yearly")}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="userLimit">{t("form.labels.userLimit")}</Label>
          <Input
            id="userLimit"
            type="number"
            min={0}
            {...form.register("userLimit")}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="centreLimit">{t("form.labels.centreLimit")}</Label>
          <Input
            id="centreLimit"
            type="number"
            min={0}
            {...form.register("centreLimit")}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organisationLimit">{t("form.labels.organisationLimit")}</Label>
          <Input
            id="organisationLimit"
            type="number"
            min={0}
            {...form.register("organisationLimit")}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="featuresStr">{t("form.labels.features")}</Label>
        <Input
          id="featuresStr"
          {...form.register("featuresStr")}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t("form.buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("form.buttons.update")}
        </Button>
      </div>
    </form>
  )
}
