"use client"

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
      <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] min-w-0 max-h-[90vh] overflow-x-hidden overflow-y-auto p-4 sm:max-w-md sm:p-6">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="h-5 w-5 shrink-0" />
            {t("emailPasswordResetDialog.title")}
          </DialogTitle>
          <DialogDescription className="wrap-break-word">
            {t("emailPasswordResetDialog.description", { email: learnerEmail })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("emailPasswordResetDialog.cancel")}
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("emailPasswordResetDialog.sending") : t("emailPasswordResetDialog.ok")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
