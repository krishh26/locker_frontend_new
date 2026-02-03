"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { useUpdateCentreMutation } from "@/store/api/centres/centreApi"
import type { UpdateCentreRequest, Centre } from "@/store/api/centres/types"
import { toast } from "sonner"
import { useEffect } from "react"

// Schema creation function that accepts translation function
const editCentreSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("validation.nameRequired")).optional(),
  status: z.enum(["active", "suspended"]).optional(),
})

type EditCentreFormValues = z.infer<ReturnType<typeof editCentreSchema>>

interface EditCentreFormProps {
  centre: Centre
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditCentreForm({
  centre,
  onSuccess,
  onCancel,
}: EditCentreFormProps) {
  const t = useTranslations("centres")
  const common = useTranslations("common")
  const [updateCentre, { isLoading: isUpdating }] = useUpdateCentreMutation()

  const form = useForm<EditCentreFormValues>({
    resolver: zodResolver(editCentreSchema(t)),
    defaultValues: {
      name: centre.name,
      status: centre.status,
    },
  })

  useEffect(() => {
    form.reset({
      name: centre.name,
      status: centre.status,
    })
  }, [centre, form])

  const onSubmit = async (values: EditCentreFormValues) => {
    try {
      const updateData: UpdateCentreRequest = {
        name: values.name,
        status: values.status,
      }

      await updateCentre({ id: centre.id, data: updateData }).unwrap()
      toast.success(t("toast.updateSuccess"))
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : undefined
      toast.error(errorMessage ?? t("toast.updateFailed"))
    }
  }

  const isLoading = isUpdating
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("form.name")}
          <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="name"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="name"
                placeholder={t("form.namePlaceholder")}
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

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">
          {t("form.status")}
          <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <>
              <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                <SelectTrigger
                  id="status"
                  className={form.formState.errors.status ? "w-full border-destructive" : "w-full"}
                >
                  <SelectValue placeholder={t("form.statusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("form.statusActive")}</SelectItem>
                  <SelectItem value="suspended">{t("form.statusSuspended")}</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.status.message}
                </p>
              )}
            </>
          )}
        />
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
          {common("cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("form.updateCentre")}
        </Button>
      </div>
    </form>
  )
}
