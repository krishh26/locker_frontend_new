"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Support } from "@/store/api/support/types"
import { useTranslations } from "next-intl"

interface SupportDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  support: Support | null
  onConfirm: () => void
  isLoading?: boolean
}

export function SupportDeleteDialog({
  open,
  onOpenChange,
  support,
  onConfirm,
  isLoading,
}: SupportDeleteDialogProps) {
  const t = useTranslations("support")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("deleteDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDialog.description", {
              title: support?.title ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading
              ? t("deleteDialog.deleting")
              : t("deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

