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
import type { Innovation } from "@/store/api/innovations/types"

interface InnovationsDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  innovation: Innovation | null
  onConfirm: () => void
  isLoading?: boolean
}

export function InnovationsDeleteDialog({
  open,
  onOpenChange,
  innovation,
  onConfirm,
  isLoading,
}: InnovationsDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Your Innovation?</AlertDialogTitle>
          <AlertDialogDescription>
            Deleting this innovation will also remove all associated data and
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
            {isLoading ? "Deleting..." : "Delete Innovation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

