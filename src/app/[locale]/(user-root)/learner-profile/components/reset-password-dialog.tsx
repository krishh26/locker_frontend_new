"use client"

import { useMemo, useState } from "react"
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .refine(
        (value) => PASSWORD_REGEX.test(value),
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

const DEFAULT_SUCCESS_MESSAGE = "Password reset successfully"
const DEFAULT_ERROR_MESSAGE =
  "We couldn't reset the password right now. Please try again in a moment."

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
          : DEFAULT_ERROR_MESSAGE

    setErrorMessage(message)
    toast.error(message)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!learnerEmail) {
      handleApiError(new Error("Learner email is required"))
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
          : DEFAULT_SUCCESS_MESSAGE

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
    () => (showPassword ? "Hide" : "Show"),
    [showPassword],
  )

  const confirmPasswordToggleLabel = useMemo(
    () => (showConfirmPassword ? "Hide" : "Show"),
    [showConfirmPassword],
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
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {learnerName ? (
              <>
                Reset password for <span className="font-medium">{learnerName}</span> ({learnerEmail})
              </>
            ) : (
              <>Reset password for {learnerEmail}</>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
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
            Password must be at least 6 characters long and include upper & lower case letters
            and a number.
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
