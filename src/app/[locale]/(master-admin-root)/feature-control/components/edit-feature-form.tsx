"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateFeatureLimitsMutation } from "@/store/api/feature-control/featureControlApi"
import type { Feature } from "@/store/api/feature-control/types"
import { toast } from "sonner"
import { useEffect } from "react"

const editFeatureSchema = z.object({
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

type EditFeatureFormValues = z.infer<typeof editFeatureSchema>

interface EditFeatureFormProps {
  feature: Feature
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditFeatureForm({
  feature,
  onSuccess,
  onCancel,
}: EditFeatureFormProps) {
  const [updateLimits, { isLoading: isUpdating }] = useUpdateFeatureLimitsMutation()

  const form = useForm<EditFeatureFormValues>({
    resolver: zodResolver(editFeatureSchema),
    mode: "onChange",
    defaultValues: {
      maxUsers: feature.limits?.maxUsers?.toString() || "",
      maxCentres: feature.limits?.maxCentres?.toString() || "",
      maxOrganisations: feature.limits?.maxOrganisations?.toString() || "",
    },
  })

  useEffect(() => {
    form.reset({
      maxUsers: feature.limits?.maxUsers?.toString() || "",
      maxCentres: feature.limits?.maxCentres?.toString() || "",
      maxOrganisations: feature.limits?.maxOrganisations?.toString() || "",
    })
  }, [feature, form])

  const onSubmit = async (values: EditFeatureFormValues) => {
    try {
      const limits: { maxUsers?: number; maxCentres?: number; maxOrganisations?: number } = {}
      if (values.maxUsers && values.maxUsers.trim() !== "") {
        limits.maxUsers = parseInt(values.maxUsers, 10)
      }
      if (values.maxCentres && values.maxCentres.trim() !== "") {
        limits.maxCentres = parseInt(values.maxCentres, 10)
      }
      if (values.maxOrganisations && values.maxOrganisations.trim() !== "") {
        limits.maxOrganisations = parseInt(values.maxOrganisations, 10)
      }

      await updateLimits({
        featureId: feature.id,
        limits,
      }).unwrap()
      toast.success("Feature limits updated successfully")
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : "Failed to update feature limits"
      toast.error(errorMessage)
    }
  }

  const isLoading = isUpdating
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Feature Info (Read-only) */}
      <div className="space-y-2">
        <Label>Feature Name</Label>
        <Input value={feature.name} disabled />
      </div>
      <div className="space-y-2">
        <Label>Feature Code</Label>
        <Input value={feature.code} disabled />
      </div>
      {feature.description && (
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={feature.description} disabled rows={3} />
        </div>
      )}

      {/* Limits */}
      <div className="space-y-4">
        <Label>Limits</Label>
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
          Update Limits
        </Button>
      </div>
    </form>
  )
}
