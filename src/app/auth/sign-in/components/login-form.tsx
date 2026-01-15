"use client"

import { useState } from "react"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation } from "@/store/api/auth/authApi"
import { useLazyGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi"
import {
  setAuthError,
  setCredentials,
  setLearnerData,
} from "@/store/slices/authSlice"
import type { RootState } from "@/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { cn, extractBaseQueryErrorMessage } from "@/lib/utils"

const loginSchema = z.object({
  email: z.email("Enter a valid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authError = useAppSelector((state: RootState) => state.auth.error)
  const [login, { isLoading: isLoginLoading }] = useLoginMutation()
  const [getLearnerDetails] = useLazyGetLearnerDetailsQuery()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting || isLoginLoading

  const onSubmit = form.handleSubmit(async (values) => {
    dispatch(setAuthError(null))
    try {
      const result = await login(values).unwrap()
      console.log("🚀 ~ onSubmit ~ result:", result)
      dispatch(setCredentials(result))
      toast.success("Signed in successfully")

      if (result.passwordChanged === false) {
        toast.info("Please update your password to continue.")
        router.push("/auth/forgot-password-2")
        return
      }

      // Fetch learner details if user role is "Learner"
      console.log("🚀 ~ LoginForm ~ result.user:", result.user)
      if (result.user?.role === "Learner" && result.user?.learner_id) {
        try {
          const learnerId = Number(result.user.learner_id)
          const learnerResponse = await getLearnerDetails(learnerId).unwrap()
          if (learnerResponse?.data) {
            dispatch(setLearnerData(learnerResponse.data))
          }
        } catch (learnerErr) {
          // Log error but don't block login
          console.error("Failed to fetch learner details:", learnerErr)
        }
      } else {
        // Clear learner data for non-learner users
        dispatch(setLearnerData(null))
      }

      router.push("/dashboard")
    } catch (err) {
      console.log("🚀 ~ onSubmit ~ err:", err)
      const message = extractBaseQueryErrorMessage(err as FetchBaseQueryError)
      dispatch(setAuthError(message))
      toast.error(message || "An error occurred while logging in. Please try again.")
    }
  })

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              {...form.register("password")}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center text-sm cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        {authError ? (
          <p className="text-destructive text-sm" role="alert">
            {authError}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Login"}
        </Button>
      </div>
    </form>
  )
}
