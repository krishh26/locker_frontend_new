"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { cn, extractBaseQueryErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useResetPasswordMutation } from "@/store/api/auth/authApi"
import {
  STORAGE_KEY_EMAIL,
  STORAGE_KEY_VERIFIED,
} from "@/app/auth/forgot-password/constants"

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

const DEFAULT_SUCCESS_MESSAGE =
  "Password updated successfully. You can now sign in with your new password."
const DEFAULT_ERROR_MESSAGE =
  "We couldn't update your password right now. Please try again in a moment."

function readStoredEmail() {
  if (typeof window === "undefined") {
    return ""
  }
  return sessionStorage.getItem(STORAGE_KEY_EMAIL) ?? ""
}

function clearSessionMarkers() {
  if (typeof window === "undefined") {
    return
  }
  sessionStorage.removeItem(STORAGE_KEY_EMAIL)
  sessionStorage.removeItem(STORAGE_KEY_VERIFIED)
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [email, setEmail] = useState<string>("")
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

  useEffect(() => {
    const storedEmail = readStoredEmail()
    const verified =
      typeof window !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEY_VERIFIED) === "true"
        : false

    if (!storedEmail || !verified) {
      router.replace("/auth/forgot-password")
      return
    }
    if (!storedEmail) {
      return
    }
    setEmail(storedEmail)
  }, [router])

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
    if (!email) {
      handleApiError(new Error("We couldn't find your reset session. Please request a new code."))
      router.replace("/auth/forgot-password")
      return
    }

    setErrorMessage(null)

    try {
      const response = await resetPassword({
        email,
        password: values.password,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : DEFAULT_SUCCESS_MESSAGE

      clearSessionMarkers()
      toast.success(message)

      const redirect =
        typeof response?.redirectTo === "string" && response.redirectTo.length > 0
          ? response.redirectTo
          : "/auth/sign-in"

      router.push(redirect)
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

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Create a strong password for{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>
      <div className="grid gap-6">
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
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Reset password"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <a href="/auth/sign-in" className="underline underline-offset-4">
          Back to sign in
        </a>
      </div>
    </form>
  )
}

