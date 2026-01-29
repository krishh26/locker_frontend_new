"use client"

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
import { useCreatePlanMutation } from "@/store/api/subscriptions/subscriptionApi"
import type { CreatePlanRequest } from "@/store/api/subscriptions/types"
import { toast } from "sonner"

interface CreatePlanFormValues {
  name: string
  code: string
  description?: string
  price: number
  currency: string
  billingCycle: "monthly" | "yearly"
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  featuresStr?: string
}

const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  currency: z.string().min(1, "Currency is required"),
  billingCycle: z.enum(["monthly", "yearly"]),
  userLimit: z.optional(z.coerce.number().min(0)),
  centreLimit: z.optional(z.coerce.number().min(0)),
  organisationLimit: z.optional(z.coerce.number().min(0)),
  featuresStr: z.string().optional(),
})

interface CreatePlanFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreatePlanForm({ onSuccess, onCancel }: CreatePlanFormProps) {
  const [createPlanMutation, { isLoading }] = useCreatePlanMutation()

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema) as unknown as Resolver<CreatePlanFormValues>,
    mode: "onChange",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      currency: "GBP",
      billingCycle: "monthly",
      userLimit: undefined,
      centreLimit: undefined,
      organisationLimit: undefined,
      featuresStr: "",
    },
  })

  const onSubmit = async (values: CreatePlanFormValues) => {
    try {
      const features = values.featuresStr
        ? values.featuresStr.split(",").map((s) => s.trim()).filter(Boolean)
        : []
      const body: CreatePlanRequest = {
        name: values.name,
        code: values.code,
        description: values.description || undefined,
        price: values.price,
        currency: values.currency,
        billingCycle: values.billingCycle,
        userLimit: values.userLimit,
        centreLimit: values.centreLimit,
        organisationLimit: values.organisationLimit,
        features,
      }
      await createPlanMutation(body).unwrap()
      toast.success("Plan created successfully")
      form.reset()
      onSuccess?.()
    } catch (error: unknown) {
      const msg =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
            ? error.message
            : "Failed to create plan"
      toast.error(msg)
    }
  }

  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="e.g. Pro"
            {...form.register("name")}
            className={form.formState.errors.name ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <Input
            id="code"
            placeholder="e.g. PRO"
            {...form.register("code")}
            className={form.formState.errors.code ? "border-destructive" : ""}
            disabled={isLoading}
          />
          {form.formState.errors.code && (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Plan description"
          {...form.register("description")}
          disabled={isLoading}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Controller
            name="currency"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger id="currency" className={form.formState.errors.currency ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select currency" />
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
        <Label>Billing cycle *</Label>
        <Controller
          name="billingCycle"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
              <SelectTrigger className={form.formState.errors.billingCycle ? "border-destructive" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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
          placeholder="e.g. Lockers, Reports, API"
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
          Create Plan
        </Button>
      </div>
    </form>
  )
}
