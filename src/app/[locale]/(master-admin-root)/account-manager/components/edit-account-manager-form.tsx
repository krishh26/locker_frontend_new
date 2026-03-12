"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUpdateAccountManagerMutation } from "@/store/api/account-manager/accountManagerApi"
import type { UpdateAccountManagerRequest, AccountManager } from "@/store/api/account-manager/types"
import { toast } from "sonner"
import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

type EditAccountManagerFormValues = {
  email: string
  firstName?: string
  lastName?: string
}

interface EditAccountManagerFormProps {
  accountManager: AccountManager
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditAccountManagerForm({
  accountManager,
  onSuccess,
  onCancel,
}: EditAccountManagerFormProps) {
  const t = useTranslations("accountManager")
  const [updateAccountManager, { isLoading: isUpdating }] = useUpdateAccountManagerMutation()

  const schema = useMemo(
    () =>
      z.object({
        email: z
          .string()
          .email(t("validation.invalidEmail"))
          .min(1, t("validation.emailRequired")),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }),
    [t]
  )

  const form = useForm<EditAccountManagerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: accountManager.email,
      firstName: accountManager.firstName || "",
      lastName: accountManager.lastName || "",
    },
  })

  useEffect(() => {
    form.reset({
      email: accountManager.email,
      firstName: accountManager.firstName || "",
      lastName: accountManager.lastName || "",
    })
  }, [accountManager, form])

  const onSubmit = async (values: EditAccountManagerFormValues) => {
    try {
      const updateData: UpdateAccountManagerRequest = {
        email: values.email,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      }

      await updateAccountManager({ id: accountManager.id, data: updateData }).unwrap()
      toast.success(t("toast.updateSuccess"))
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
          {t("form.emailLabel")} <span className="text-destructive">*</span>
        </Label>
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

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">{t("form.firstNameLabel")}</Label>
        <Controller
          name="firstName"
          control={form.control}
          render={({ field }) => (
            <Input
              id="firstName"
              placeholder={t("form.firstNamePlaceholder")}
              {...field}
              disabled={isLoading}
            />
          )}
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">{t("form.lastNameLabel")}</Label>
        <Controller
          name="lastName"
          control={form.control}
          render={({ field }) => (
            <Input
              id="lastName"
              placeholder={t("form.lastNamePlaceholder")}
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
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading || hasErrors} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("form.updateSubmit")}
        </Button>
      </div>
    </form>
  )
}
