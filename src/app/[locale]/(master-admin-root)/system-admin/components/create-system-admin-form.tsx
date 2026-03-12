"use client"

import { useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateSystemAdminMutation } from "@/store/api/system-admin/systemAdminApi"
import type { CreateSystemAdminRequest } from "@/store/api/system-admin/types"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface CreateSystemAdminFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateSystemAdminForm({
  onSuccess,
  onCancel,
}: CreateSystemAdminFormProps) {
  const t = useTranslations("systemAdmin")
  const [createSystemAdmin, { isLoading: isCreating }] = useCreateSystemAdminMutation()

  const createSystemAdminSchema = useMemo(() => {
    return z.object({
      email: z
        .string()
        .email(t("validation.invalidEmail"))
        .min(1, t("validation.emailRequired")),
      password: z.string().min(6, t("validation.passwordMin", { min: 6 })),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    })
  }, [t])

  type CreateSystemAdminFormValues = z.infer<typeof createSystemAdminSchema>

  const form = useForm<CreateSystemAdminFormValues>({
    resolver: zodResolver(createSystemAdminSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  })

  const onSubmit = async (values: CreateSystemAdminFormValues) => {
    try {
      const createData: CreateSystemAdminRequest = {
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      }

      await createSystemAdmin(createData).unwrap()
      toast.success(t("toast.createdSuccess"))
      form.reset()
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : t("toast.createFailedFallback")
      toast.error(errorMessage)
    }
  }

  const isLoading = isCreating
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

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          {t("form.labels.password")}
        </Label>
        <Controller
          name="password"
          control={form.control}
          render={({ field }) => (
            <>
              <Input
                id="password"
                type="password"
                placeholder={t("form.placeholders.password")}
                {...field}
                className={form.formState.errors.password ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
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
          {t("form.buttons.create")}
        </Button>
      </div>
    </form>
  )
}
