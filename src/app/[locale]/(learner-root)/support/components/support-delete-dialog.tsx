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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Support?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this support request will also remove all associated data and
            relationships. Proceed with deletion?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Support"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

