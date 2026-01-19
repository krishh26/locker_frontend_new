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

interface DeleteDocumentDialogProps {
  open: boolean
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteDocumentDialog({
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteDocumentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Document?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this document? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className='bg-destructive hover:bg-destructive/90'
          >
            {isDeleting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

