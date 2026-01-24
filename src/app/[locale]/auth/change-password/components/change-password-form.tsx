"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "@/i18n/navigation"
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
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { selectAuthUser, updateUser } from "@/store/slices/authSlice"

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

const changePasswordSchema = z
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

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const DEFAULT_SUCCESS_MESSAGE =
  "Password updated successfully. Redirecting to dashboard..."
const DEFAULT_ERROR_MESSAGE =
  "We couldn't update your password right now. Please try again in a moment."

export function ChangePasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectAuthUser)
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

  // Redirect to sign-in if user is not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in")
    }
  }, [user, router])

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
    if (!user?.email) {
      handleApiError(new Error("Unable to find your account. Please sign in again."))
      router.push("/auth/sign-in")
      return
    }

    setErrorMessage(null)

    try {
      const response = await resetPassword({
        email: user.email,
        password: values.password,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : DEFAULT_SUCCESS_MESSAGE

      // Update user's password_changed status in auth state
      if (user) {
        dispatch(updateUser({
          ...user,
          password_changed: true,
        }))
      }

      toast.success(message)

      const redirect =
        typeof response?.redirectTo === "string" && response.redirectTo.length > 0
          ? response.redirectTo
          : "/dashboard"

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
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Change your password</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {user?.email ? (
            <>
              Enter your new password for{" "}
              <span className="font-medium text-foreground">{user.email}</span>.
            </>
          ) : (
            "Please enter your new password for your account."
          )}
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
          {isSubmitting ? "Updating..." : "Change password"}
        </Button>
      </div>
      <div className="text-center text-sm">
        <Link href="/dashboard" className="underline underline-offset-4">
          Back to dashboard
        </Link>
      </div>
    </form>
  )
}
