"use client"

import { useForm, Controller } from "react-hook-form"
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
import { useCreateFeatureMutation } from "@/store/api/feature-control/featureControlApi"
import type { CreateFeatureRequest } from "@/store/api/feature-control/types"
import { FeatureType } from "@/store/api/feature-control/types"
import { toast } from "sonner"

const createFeatureSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  code: z.string().regex(/^[a-zA-Z0-9_]+$/, "Code must be alphanumeric with underscores only"),
  description: z.string().optional(),
  type: z.nativeEnum(FeatureType).optional(),
  maxUsers: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || (!isNaN(Number(val)) && Number(val) > 0),
      { message: "Must be a positive number" }
    ),
  maxCentres: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || (!isNaN(Number(val)) && Number(val) > 0),
      { message: "Must be a positive number" }
    ),
  maxOrganisations: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === "" || (!isNaN(Number(val)) && Number(val) > 0),
      { message: "Must be a positive number" }
    ),
})

type CreateFeatureFormValues = z.infer<typeof createFeatureSchema>

interface CreateFeatureFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateFeatureForm({
  onSuccess,
  onCancel,
}: CreateFeatureFormProps) {
  const [createFeature, { isLoading: isCreating }] = useCreateFeatureMutation()

  const form = useForm<CreateFeatureFormValues>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      type: FeatureType.Limit,
      maxUsers: "",
      maxCentres: "",
      maxOrganisations: "",
    },
  })

  const onSubmit = async (values: CreateFeatureFormValues) => {
    try {
      const limits: CreateFeatureRequest["limits"] = {}
      if (values.maxUsers && values.maxUsers.trim() !== "") {
        limits.maxUsers = parseInt(values.maxUsers, 10)
      }
      if (values.maxCentres && values.maxCentres.trim() !== "") {
        limits.maxCentres = parseInt(values.maxCentres, 10)
      }
      if (values.maxOrganisations && values.maxOrganisations.trim() !== "") {
        limits.maxOrganisations = parseInt(values.maxOrganisations, 10)
      }

      const createData: CreateFeatureRequest = {
        name: values.name,
        code: values.code,
        description: values.description || undefined,
        type: values.type,
        limits: Object.keys(limits).length > 0 ? limits : undefined,
      }

      await createFeature(createData).unwrap()
      toast.success("Feature created successfully")
      form.reset()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to create feature"
      toast.error(errorMessage)
    }
  }

  const isLoading = isCreating
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="name"
                placeholder="Feature Name"
                {...field}
                className={form.formState.errors.name ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      {/* Code */}
      <div className="space-y-2">
        <Label htmlFor="code">
          Code <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="code"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="code"
                placeholder="feature_code"
                {...field}
                className={form.formState.errors.code ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Alphanumeric characters and underscores only
              </p>
            </>
          )}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Textarea
              id="description"
              placeholder="Feature description..."
              {...field}
              disabled={isLoading}
              rows={3}
            />
          )}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Controller
          name="type"
          control={form.control}
          render={({ field }) => (
            <>
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as FeatureType)}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="type"
                  className={form.formState.errors.type ? "w-full border-destructive" : "w-full"}
                >
                  <SelectValue placeholder="Select feature type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FeatureType.Limit}>Limit</SelectItem>
                  <SelectItem value={FeatureType.Toggle}>Toggle</SelectItem>
                  <SelectItem value={FeatureType.Usage}>Usage</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.type.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Limit: Numeric constraint, Toggle: On/Off feature, Usage: Usage tracking
              </p>
            </>
          )}
        />
      </div>

      {/* Limits */}
      <div className="space-y-4">
        <Label>Limits (Optional)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxUsers" className="text-sm">Max Users</Label>
            <Controller
              name="maxUsers"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="maxUsers"
                  type="number"
                  placeholder="Unlimited"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isLoading}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCentres" className="text-sm">Max Centres</Label>
            <Controller
              name="maxCentres"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="maxCentres"
                  type="number"
                  placeholder="Unlimited"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isLoading}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxOrganisations" className="text-sm">Max Organisations</Label>
            <Controller
              name="maxOrganisations"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="maxOrganisations"
                  type="number"
                  placeholder="Unlimited"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={isLoading}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
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
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Feature
        </Button>
      </div>
    </form>
  )
}
