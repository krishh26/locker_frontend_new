"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useResetPasswordMutation } from "@/store/api/auth/authApi"
import { extractBaseQueryErrorMessage } from "@/lib/utils"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

function getChangePasswordSchema(t: (key: string) => string) {
  return z
    .object({
      password: z
        .string()
        .min(6, t("changePasswordDialog.validation.passwordMin"))
        .refine(
          (value) => PASSWORD_REGEX.test(value),
          t("changePasswordDialog.validation.passwordPattern"),
        ),
      confirmPassword: z.string().min(1, t("changePasswordDialog.validation.confirmRequired")),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: t("changePasswordDialog.validation.passwordsMismatch"),
        })
      }
    })
}

type ChangePasswordFormValues = z.infer<ReturnType<typeof getChangePasswordSchema>>

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
  userName?: string
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userEmail,
  userName,
}: ChangePasswordDialogProps) {
  const t = useTranslations("users")
  const changePasswordSchema = useMemo(
    () => getChangePasswordSchema((key) => t(key)),
    [t],
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting || isLoading

  const handleApiError = (error: unknown) => {
    const extractedMessage = extractBaseQueryErrorMessage(
      error as FetchBaseQueryError,
    )
    const message =
      extractedMessage && extractedMessage.trim().length > 0
        ? extractedMessage
        : error instanceof Error && error.message.trim().length > 0
          ? error.message
          : t("changePasswordDialog.errorDefault")

    setErrorMessage(message)
    toast.error(message)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!userEmail) {
      handleApiError(new Error(t("changePasswordDialog.emailRequired")))
      return
    }

    setErrorMessage(null)

    try {
      const response = await resetPassword({
        email: userEmail,
        password: values.password,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : t("changePasswordDialog.successDefault")

      toast.success(message)

      form.reset()
      setErrorMessage(null)
      onOpenChange(false)
    } catch (error) {
      handleApiError(error)
    }
  })

  const passwordToggleLabel = useMemo(
    () => (showPassword ? t("changePasswordDialog.hide") : t("changePasswordDialog.show")),
    [showPassword, t],
  )

  const confirmPasswordToggleLabel = useMemo(
    () => (showConfirmPassword ? t("changePasswordDialog.hide") : t("changePasswordDialog.show")),
    [showConfirmPassword, t],
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      setErrorMessage(null)
      setShowPassword(false)
      setShowConfirmPassword(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changePasswordDialog.title")}</DialogTitle>
          <DialogDescription>
            {userName
              ? t("changePasswordDialog.descriptionWithName", { name: userName, email: userEmail })
              : t("changePasswordDialog.descriptionEmailOnly", { email: userEmail })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="change-password">{t("changePasswordDialog.newPassword")}</Label>
            <div className="relative">
              <Input
                id="change-password"
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                {...form.register("password")}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center text-sm"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={`${passwordToggleLabel} password`}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="change-confirm-password">{t("changePasswordDialog.confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="change-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                disabled={isSubmitting}
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center text-sm"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={`${confirmPasswordToggleLabel} confirm password`}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {form.formState.errors.confirmPassword ? (
              <p className="text-destructive text-sm">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            {t("changePasswordDialog.hintText")}
          </p>
          {errorMessage ? (
            <p className="text-destructive text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("changePasswordDialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("changePasswordDialog.changing") : t("changePasswordDialog.changePassword")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
