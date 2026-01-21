import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  return (
    <div className='flex justify-end flex-wrap gap-2 px-6 py-4 border-b'>
      <Button
        variant='outline'
        onClick={onClose}
        className='border-orange-500 text-orange-500 hover:bg-orange-50'
      >
        Cancel / Close
      </Button>
      <Button
        variant='outline'
        onClick={onDelete}
        disabled={!planDetailId || isReadOnly}
        className='border-red-500 text-red-500 hover:bg-red-50'
      >
        Delete
      </Button>
      {onSave && (
        <>
          <Button
            onClick={onSave}
            disabled={isSaving || isReadOnly}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
          <Button
            onClick={() => {
              onSave()
              onClose()
            }}
            disabled={isSaving || isReadOnly}
            className='bg-green-600 hover:bg-green-700'
          >
            {isSaving ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save & Close'
            )}
          </Button>
        </>
      )}
    </div>
  )
}

