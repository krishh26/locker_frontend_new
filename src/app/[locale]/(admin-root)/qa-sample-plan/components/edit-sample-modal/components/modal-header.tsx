import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'

export function ModalHeader() {
  const t = useTranslations('qaSamplePlan.editSampleModal.header')
  return (
    <DialogHeader className='px-6 py-4 border-b'>
      <DialogTitle>{t('title')}</DialogTitle>
    </DialogHeader>
  )
}

