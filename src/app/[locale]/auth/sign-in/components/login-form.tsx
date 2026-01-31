"use client"

import { useState } from "react"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "@/i18n/navigation"
import { Link } from "@/i18n/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLoginMutation } from "@/store/api/auth/authApi"
import type { AuthUser } from "@/store/api/auth/types"
import { useLazyGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi"
import { useLazyGetUserQuery } from "@/store/api/user/userApi"
import {
  setAuthError,
  setCredentials,
  setLearnerData,
  updateUser,
} from "@/store/slices/authSlice"
import type { RootState } from "@/store"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { cn, extractBaseQueryErrorMessage } from "@/lib/utils"
import { useTranslations } from "next-intl"

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
  const [getUser, { isLoading: isGettingUser }] = useLazyGetUserQuery()
  const [showPassword, setShowPassword] = useState(false)

  const t = useTranslations("auth")

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting || isLoginLoading || isGettingUser

  const onSubmit = form.handleSubmit(async (values) => {
    dispatch(setAuthError(null))
    try {
      const result = await login(values).unwrap()
      console.log("🚀 ~ LoginForm ~ result:", result)
      dispatch(setCredentials(result))
      toast.success("Signed in successfully")

      // Fetch learner details if user role is "Learner"
      if (result.user?.role === "Learner" && result.user?.learner_id) {
        try {
          const learnerId = Number(result.user.learner_id)
          const learnerResponse = await getLearnerDetails(learnerId).unwrap()
          if (learnerResponse?.data) {
            dispatch(setLearnerData({
              ...learnerResponse.data,
              role: 'Learner',
            }))
          }
        } catch (learnerErr) {
          // Log error but don't block login
          console.error("Failed to fetch learner details:", learnerErr)
        }
        if (result.passwordChanged === false) {
          toast.info("Please update your password to continue.")
          router.push("/auth/change-password")
          return
        }
        router.push("/dashboard")
      } else {
        // Clear learner data for non-learner users
        dispatch(setLearnerData(null))
        
        // Trigger user fetch - the query will run automatically via useEffect
        const userResponse = await getUser().unwrap()
        const userData = userResponse.data
        const authUser: AuthUser = {
          id: userData.user_id?.toString(),
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.roles?.[0],
          roles: userData.roles,
          // Include all other user data
          user_id: userData.user_id,
          user_name: userData.user_name,
          mobile: userData.mobile,
          avatar: userData.avatar,
          password_changed: userData.password_changed,
          time_zone: userData.time_zone,
          status: userData.status,
          line_manager: userData.line_manager,
          number_of_active_learners: userData.number_of_active_learners,
          assigned_employers: userData.assigned_employers,
          userEmployers: userData.userEmployers,
          // Include assignedOrganisationIds from login response
          assignedOrganisationIds: result.user?.assignedOrganisationIds ?? null,
        }
        dispatch(updateUser(authUser))
        if (result.passwordChanged === false) {
          toast.info("Please update your password to continue.")
          router.push("/auth/change-password")
          return
        }
        router.push("/dashboard")
      }

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
          {t("enterYourEmailBelowToLoginToYourAccount")}
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
            <Link
              href="/auth/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
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
