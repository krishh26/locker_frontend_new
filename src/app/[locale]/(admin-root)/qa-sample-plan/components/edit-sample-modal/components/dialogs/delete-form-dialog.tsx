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
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('qaSamplePlan.editSampleModal.dialogs.deleteForm')
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isUnlinking}
            className='bg-destructive hover:bg-destructive/90'
          >
            {isUnlinking ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('removing')}
              </>
            ) : (
              t('confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

