import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ActionButtonsBarProps {
  planDetailId: string | number | null
  isSaving: boolean
  onClose: () => void
  onDelete: () => void
  onSave?: () => void
  isReadOnly?: boolean
}

export function ActionButtonsBar({
  planDetailId,
  isSaving,
  onClose,
  onDelete,
  onSave,
  isReadOnly = false,
}: ActionButtonsBarProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.actionButtons')
  return (
    <div className='flex justify-end flex-wrap gap-2 px-6 py-4 border-b'>
      <Button
        variant='outline'
        onClick={onClose}
        className='border-secondary text-secondary hover:bg-secondary'
      >
        {t('cancelClose')}
      </Button>
      <Button
        variant='outline'
        onClick={onDelete}
        disabled={!planDetailId || isReadOnly}
        className='border-destructive text-destructive hover:bg-destructive'
      >
        {t('delete')}
      </Button>
      {onSave && (
        <>
          <Button
            onClick={onSave}
            disabled={isSaving || isReadOnly}
            className='bg-accent hover:bg-accent/90'
          >
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('saving')}
              </>
            ) : (
              t('save')
            )}
          </Button>
          <Button
            onClick={() => {
              onSave()
              onClose()
            }}
            disabled={isSaving || isReadOnly}
            className='bg-accent hover:bg-accent/90'
          >
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {t('saving')}
              </>
            ) : (
              t('saveClose')
            )}
          </Button>
        </>
      )}
    </div>
  )
}

