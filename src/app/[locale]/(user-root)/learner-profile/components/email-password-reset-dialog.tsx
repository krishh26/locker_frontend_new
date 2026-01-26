"use client"

import { useState } from "react"
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query"
import { toast } from "sonner"
import { Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSendPasswordResetEmailMutation } from "@/store/api/user/userApi"
import { extractBaseQueryErrorMessage } from "@/lib/utils"

const DEFAULT_SUCCESS_MESSAGE = "Password reset email sent successfully"
const DEFAULT_ERROR_MESSAGE =
  "We couldn't send the password reset email right now. Please try again in a moment."

interface EmailPasswordResetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learnerEmail: string
  learnerName?: string
}

export function EmailPasswordResetDialog({
  open,
  onOpenChange,
  learnerEmail,
  learnerName,
}: EmailPasswordResetDialogProps) {
  const [sendPasswordResetEmail, { isLoading }] = useSendPasswordResetEmailMutation()

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

    toast.error(message)
  }

  const handleConfirm = async () => {
    if (!learnerEmail) {
      toast.error("Learner email is required")
      return
    }

    try {
      const response = await sendPasswordResetEmail({
        email: learnerEmail,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : DEFAULT_SUCCESS_MESSAGE

      toast.success(message)
      onOpenChange(false)
    } catch (error) {
      handleApiError(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Password Reset
          </DialogTitle>
          <DialogDescription>
            {learnerName ? (
              <>
                Are you sure you wish to reset the password?
                <br />
                An email will be sent to <span className="font-medium">{learnerEmail}</span> with reset instructions.
              </>
            ) : (
              <>
                Are you sure you wish to reset the password?
                <br />
                An email will be sent to <span className="font-medium">{learnerEmail}</span> with reset instructions.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Sending..." : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
