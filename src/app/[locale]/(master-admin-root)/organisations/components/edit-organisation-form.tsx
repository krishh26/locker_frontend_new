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
import { useUpdateOrganisationMutation } from "@/store/api/organisations/organisationApi"
import type { UpdateOrganisationRequest, Organisation } from "@/store/api/organisations/types"
import { toast } from "sonner"
import { useEffect } from "react"

// Schema creation function that accepts translation function
const editOrganisationSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t("validation.nameRequired")).optional(),
  email: z.string().email(t("validation.emailInvalid")).optional().or(z.literal("")),
  status: z.enum(["active", "suspended"]).optional(),
})

type EditOrganisationFormValues = z.infer<ReturnType<typeof editOrganisationSchema>>

interface EditOrganisationFormProps {
  organisation: Organisation
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditOrganisationForm({
  organisation,
  onSuccess,
  onCancel,
}: EditOrganisationFormProps) {
  const t = useTranslations("organisations")
  const common = useTranslations("common")
  const [updateOrganisation, { isLoading: isUpdating }] = useUpdateOrganisationMutation()

  const form = useForm<EditOrganisationFormValues>({
    resolver: zodResolver(editOrganisationSchema(t)),
    mode: "onChange",
    defaultValues: {
      name: organisation.name,
      email: organisation.email || "",
      status: organisation.status,
    },
  })

  useEffect(() => {
    form.reset({
      name: organisation.name,
      email: organisation.email || "",
      status: organisation.status,
    })
  }, [organisation, form])

  const onSubmit = async (values: EditOrganisationFormValues) => {
    try {
      const updateData: UpdateOrganisationRequest = {
        name: values.name,
        email: values.email || undefined,
        status: values.status,
      }

      await updateOrganisation({ id: organisation.id, data: updateData }).unwrap()
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
          <span className="text-destructive">{t("form.required")}</span>
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

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Controller
          name="email"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                {...field}
                className={form.formState.errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
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
          <span className="text-destructive">{t("form.required")}</span>
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
          {t("form.updateOrganisation")}
        </Button>
      </div>
    </form>
  )
}
