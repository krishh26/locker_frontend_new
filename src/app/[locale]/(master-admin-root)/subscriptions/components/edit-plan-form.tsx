"use client"

import { useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdatePlanMutation } from "@/store/api/subscriptions/subscriptionApi"
import type { Plan, UpdatePlanRequest } from "@/store/api/subscriptions/types"
import { toast } from "sonner"

interface EditPlanFormValues {
  name: string
  description?: string
  price: number
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  featuresStr?: string
}

const editPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  userLimit: z.optional(z.coerce.number().min(0)),
  centreLimit: z.optional(z.coerce.number().min(0)),
  organisationLimit: z.optional(z.coerce.number().min(0)),
  featuresStr: z.string().optional(),
})

interface EditPlanFormProps {
  plan: Plan
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditPlanForm({ plan, onSuccess, onCancel }: EditPlanFormProps) {
  const [updatePlan, { isLoading }] = useUpdatePlanMutation()

  const form = useForm<EditPlanFormValues>({
    resolver: zodResolver(editPlanSchema) as unknown as Resolver<EditPlanFormValues>,
    mode: "onChange",
    defaultValues: {
      name: plan.name,
      description: plan.description ?? "",
      price: plan.price,
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
        userLimit: values.userLimit,
        centreLimit: values.centreLimit,
        organisationLimit: values.organisationLimit,
        features,
      }
      await updatePlan({ id: plan.id, data: body }).unwrap()
      toast.success("Plan updated successfully")
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : "Failed to update plan"
      toast.error(msg)
    }
  }

  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Code</Label>
        <Input value={plan.code} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Code cannot be changed.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
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
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register("description")}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price *</Label>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="userLimit">User limit</Label>
          <Input
            id="userLimit"
            type="number"
            min={0}
            {...form.register("userLimit")}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="centreLimit">Centre limit</Label>
          <Input
            id="centreLimit"
            type="number"
            min={0}
            {...form.register("centreLimit")}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="organisationLimit">Organisation limit</Label>
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
        <Label htmlFor="featuresStr">Features (comma-separated)</Label>
        <Input
          id="featuresStr"
          {...form.register("featuresStr")}
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Plan
        </Button>
      </div>
    </form>
  )
}
