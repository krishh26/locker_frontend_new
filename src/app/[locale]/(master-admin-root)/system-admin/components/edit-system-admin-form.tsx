"use client"

import { useEffect, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateSystemAdminMutation } from "@/store/api/system-admin/systemAdminApi"
import type { UpdateSystemAdminRequest, SystemAdmin } from "@/store/api/system-admin/types"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface EditSystemAdminFormProps {
  systemAdmin: SystemAdmin
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditSystemAdminForm({
  systemAdmin,
  onSuccess,
  onCancel,
}: EditSystemAdminFormProps) {
  const t = useTranslations("systemAdmin")
  const [updateSystemAdmin, { isLoading: isUpdating }] = useUpdateSystemAdminMutation()

  const editSystemAdminSchema = useMemo(() => {
    return z.object({
      email: z
        .string()
        .email(t("validation.invalidEmail"))
        .min(1, t("validation.emailRequired")),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
  }, [t])

  type EditSystemAdminFormValues = z.infer<typeof editSystemAdminSchema>

  const form = useForm<EditSystemAdminFormValues>({
    resolver: zodResolver(editSystemAdminSchema),
    defaultValues: {
      email: systemAdmin.email,
      firstName: systemAdmin.firstName || "",
      lastName: systemAdmin.lastName || "",
    },
  })

  useEffect(() => {
    form.reset({
      email: systemAdmin.email,
      firstName: systemAdmin.firstName || "",
      lastName: systemAdmin.lastName || "",
    })
  }, [systemAdmin, form])

  const onSubmit = async (values: EditSystemAdminFormValues) => {
    try {
      const updateData: UpdateSystemAdminRequest = {
        email: values.email,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      }

      await updateSystemAdmin({ id: systemAdmin.id, data: updateData }).unwrap()
      toast.success(t("toast.updatedSuccess"))
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toast.updateFailedFallback")
      toast.error(errorMessage)
    }
  }

  const isLoading = isUpdating
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          {t("form.labels.email")}
        </Label>
        <Controller
          name="email"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="email"
                type="email"
                placeholder={t("form.placeholders.email")}
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

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">{t("form.labels.firstName")}</Label>
        <Controller
          name="firstName"
          control={form.control}
          render={({ field }) => (
            <Input
              id="firstName"
              placeholder={t("form.placeholders.firstName")}
              {...field}
              disabled={isLoading}
            />
          )}
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">{t("form.labels.lastName")}</Label>
        <Controller
          name="lastName"
          control={form.control}
          render={({ field }) => (
            <Input
              id="lastName"
              placeholder={t("form.placeholders.lastName")}
              {...field}
              disabled={isLoading}
            />
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
          {t("form.buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("form.buttons.update")}
        </Button>
      </div>
    </form>
  )
}
