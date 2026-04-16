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

function getResetPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      password: z
        .string()
        .min(6, t("resetPasswordDialog.validation.passwordMin"))
        .refine(
          (value) => PASSWORD_REGEX.test(value),
          t("resetPasswordDialog.validation.passwordPattern"),
        ),
      confirmPassword: z.string().min(1, t("resetPasswordDialog.validation.confirmRequired")),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: t("resetPasswordDialog.validation.passwordsMismatch"),
        })
      }
    })
}

type ResetPasswordFormValues = z.infer<ReturnType<typeof getResetPasswordSchema>>

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learnerEmail: string
  learnerName?: string
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  learnerEmail,
  learnerName,
}: ResetPasswordDialogProps) {
  const t = useTranslations("learnerProfile")
  const resetPasswordSchema = useMemo(
    () => getResetPasswordSchema((key) => t(key)),
    [t],
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
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
          : t("resetPasswordDialog.errorDefault")

    setErrorMessage(message)
    toast.error(message)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!learnerEmail) {
      handleApiError(new Error(t("resetPasswordDialog.learnerEmailRequired")))
      return
    }

    setErrorMessage(null)

    try {
      const response = await resetPassword({
        email: learnerEmail,
        password: values.password,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : t("resetPasswordDialog.successDefault")

      toast.success(message)

      // Reset form and close dialog
      form.reset()
      setErrorMessage(null)
      onOpenChange(false)
    } catch (error) {
      handleApiError(error)
    }
  })

  const passwordToggleLabel = useMemo(
    () => (showPassword ? t("resetPasswordDialog.hide") : t("resetPasswordDialog.show")),
    [showPassword, t],
  )

  const confirmPasswordToggleLabel = useMemo(
    () => (showConfirmPassword ? t("resetPasswordDialog.hide") : t("resetPasswordDialog.show")),
    [showConfirmPassword, t],
  )

  // Reset form when dialog opens/closes
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
          <DialogTitle>{t("resetPasswordDialog.title")}</DialogTitle>
          <DialogDescription>
            {learnerName
              ? t("resetPasswordDialog.descriptionWithName", { name: learnerName, email: learnerEmail })
              : t("resetPasswordDialog.descriptionEmailOnly", { email: learnerEmail })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="password">{t("resetPasswordDialog.newPassword")}</Label>
            <div className="relative">
              <Input
                id="password"
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
            <Label htmlFor="confirmPassword">{t("resetPasswordDialog.confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
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
            {t("resetPasswordDialog.hintText")}
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
              {t("resetPasswordDialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("resetPasswordDialog.resetting") : t("resetPasswordDialog.resetPassword")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
