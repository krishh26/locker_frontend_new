import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteFormDialogProps {
  open: boolean
  isUnlinking: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteFormDialog({
  open,
  isUnlinking,
  onOpenChange,
  onConfirm,
}: DeleteFormDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Allocated Form?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unlink this form from the sample?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isUnlinking}
            className='bg-destructive hover:bg-destructive/90'
          >
            {isUnlinking ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Removing...
              </>
            ) : (
              'Remove'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

