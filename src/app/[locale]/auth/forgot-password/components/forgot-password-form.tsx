"use client"

import { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { toast } from "sonner"
import { useRouter } from "@/i18n/navigation"

import { cn, extractBaseQueryErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useSendForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
} from "@/store/api/auth/authApi"
import {
  OTP_LENGTH,
  STORAGE_KEY_EMAIL,
  STORAGE_KEY_VERIFIED,
} from "@/app/[locale]/auth/forgot-password/constants"

import { OtpInput } from "./otp-input"

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
})

const otpSchema = z.object({
  otp: z
    .string()
    .min(6, "Enter the 6 digit code sent to your email")
    .max(6, "Enter the 6 digit code sent to your email"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
type OtpFormValues = z.infer<typeof otpSchema>

const DEFAULT_SEND_MESSAGE =
  "OTP sent successfully. Please check your inbox for the verification code."
const DEFAULT_VERIFY_MESSAGE = "OTP verified successfully. You can reset your password now."
const DEFAULT_ERROR_MESSAGE =
  "We couldn't process your request right now. Please try again in a moment."

function storeEmail(email: string) {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY_EMAIL, email)
}

function markOtpVerified() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STORAGE_KEY_VERIFIED, "true")
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [activeEmail, setActiveEmail] = useState<string>("")
  const [timer, setTimer] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sendForgotPasswordOtp, { isLoading: isSending }] =
    useSendForgotPasswordOtpMutation()
  const [verifyForgotPasswordOtp, { isLoading: isVerifying }] =
    useVerifyForgotPasswordOtpMutation()

  const emailForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  useEffect(() => {
    if (timer <= 0) {
      return
    }
    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [timer])

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

  const handleSendOtp = emailForm.handleSubmit(async (values) => {
    setErrorMessage(null)
    try {
      const response = await sendForgotPasswordOtp(values).unwrap()
      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : DEFAULT_SEND_MESSAGE

      const normalizedEmail = values.email.trim()
      setActiveEmail(normalizedEmail)
      storeEmail(normalizedEmail)
      setStep("otp")
      setTimer(59)
      otpForm.reset({ otp: "" })

      toast.success(message)
    } catch (error) {
      handleApiError(error)
    }
  })

  const handleVerifyOtp = otpForm.handleSubmit(async (values) => {
    setErrorMessage(null)
    try {
      const response = await verifyForgotPasswordOtp({
        email: activeEmail,
        otp: values.otp,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : DEFAULT_VERIFY_MESSAGE

      markOtpVerified()
      toast.success(message)

      const redirect =
        typeof response?.redirectTo === "string" && response.redirectTo.length > 0
          ? response.redirectTo
          : "/auth/reset-password"

      router.push(redirect)
    } catch (error) {
      handleApiError(error)
    }
  })

  const resendLabel = useMemo(() => {
    if (timer === 0) {
      return "Resend OTP"
    }
    const seconds = timer.toString().padStart(2, "0")
    return `Resend in 00:${seconds}`
  }, [timer])

  const disableResend = timer > 0 || isSending

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      noValidate
      onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">
          {step === "email" ? "Forgot your password?" : "Check your email"}
        </h1>
        <p className="text-muted-foreground text-sm text-balance">
          {step === "email"
            ? "Enter your registered email address to receive a one-time password."
            : `We sent a 6 digit verification code to ${activeEmail}. Enter it below to continue.`}
        </p>
      </div>
      {step === "email" ? (
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
              placeholder="you@example.com"
            autoComplete="email"
              disabled={emailForm.formState.isSubmitting || isSending}
              {...emailForm.register("email")}
          />
            {emailForm.formState.errors.email ? (
            <p className="text-destructive text-sm">
                {emailForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="text-destructive text-sm" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={emailForm.formState.isSubmitting || isSending}
          >
            {emailForm.formState.isSubmitting || isSending ? "Sending..." : "Send OTP"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="otp">Verification code</Label>
            <Controller
              name="otp"
              control={otpForm.control}
              render={({ field }) => (
                <OtpInput
                  length={OTP_LENGTH}
                  value={field.value}
                  onChange={(value) => {
                    const normalized = value.replace(/\D/g, "").slice(0, OTP_LENGTH)
                    field.onChange(normalized)
                  }}
                  onBlur={field.onBlur}
                  disabled={otpForm.formState.isSubmitting || isVerifying}
                />
              )}
            />
            {otpForm.formState.errors.otp ? (
              <p className="text-destructive text-sm">
                {otpForm.formState.errors.otp.message}
          </p>
        ) : null}
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setErrorMessage(null)
                setTimer(0)
              }}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={() => {
                if (disableResend || !activeEmail) {
                  return
                }
                void handleSendOtp()
              }}
              disabled={disableResend}
              className={cn(
                "font-medium underline-offset-4",
                disableResend
                  ? "cursor-not-allowed text-muted-foreground"
                  : "text-primary hover:underline",
              )}
            >
              {resendLabel}
            </button>
          </div>
          {errorMessage ? (
            <p className="text-destructive text-sm" role="alert">
              {errorMessage}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full cursor-pointer"
            disabled={otpForm.formState.isSubmitting || isVerifying}
        >
            {otpForm.formState.isSubmitting || isVerifying ? "Verifying..." : "Verify OTP"}
        </Button>
      </div>
      )}
      <div className="text-center text-sm">
        Remember your password?{" "}
        <a href="/auth/sign-in" className="underline underline-offset-4">
          Back to sign in
        </a>
      </div>
    </form>
  )
}
