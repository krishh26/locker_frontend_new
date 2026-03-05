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
  billingCycle: "monthly" | "yearly"
}

const createPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  billingCycle: z.enum(["monthly", "yearly"]),
})

interface CreatePlanFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreatePlanForm({ onSuccess, onCancel }: CreatePlanFormProps) {
  const [createPlanMutation, { isLoading }] = useCreatePlanMutation()

  const form = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema) as unknown as Resolver<CreatePlanFormValues>,
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: 0,
      billingCycle: "monthly",
    },
  })

  const onSubmit = async (values: CreatePlanFormValues) => {
    try {
      const body: CreatePlanRequest = {
        name: values.name,
        code: values.code,
        description: values.description || undefined,
        price: values.price,
        currency: "GBP",
        billingCycle: values.billingCycle,
        features: [],
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
          <Label htmlFor="price">Price * (GBP)</Label>
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
