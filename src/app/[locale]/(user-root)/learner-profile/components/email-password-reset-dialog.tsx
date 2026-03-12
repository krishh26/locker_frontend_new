"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("learnerProfile")
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
          : t("emailPasswordResetDialog.errorDefault")

    toast.error(message)
  }

  const handleConfirm = async () => {
    if (!learnerEmail) {
      toast.error(t("emailPasswordResetDialog.learnerEmailRequired"))
      return
    }

    try {
      const response = await sendPasswordResetEmail({
        email: learnerEmail,
      }).unwrap()

      const message =
        typeof response?.message === "string" && response.message.trim().length > 0
          ? response.message
          : t("emailPasswordResetDialog.successDefault")

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
            {t("emailPasswordResetDialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("emailPasswordResetDialog.description", { email: learnerEmail })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("emailPasswordResetDialog.cancel")}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? t("emailPasswordResetDialog.sending") : t("emailPasswordResetDialog.ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
