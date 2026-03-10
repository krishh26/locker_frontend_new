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

interface DeleteLearnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteLearnerDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteLearnerDialogProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.dialogs.deleteLearner')
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
          <AlertDialogAction onClick={onConfirm} className='bg-destructive hover:bg-destructive/90'>
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

