import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate } from '../../../utils/constants'

interface ModalTabsProps {
  plannedDates: string[]
  activeTab: number
  onTabChange: (value: number) => void
  onCreateNew?: () => void
  isCreating?: boolean
  isReadOnly?: boolean
}

export function ModalTabs({
  plannedDates,
  activeTab,
  onTabChange,
  onCreateNew,
  isCreating = false,
  isReadOnly = false,
}: ModalTabsProps) {
  const activeTabString = String(activeTab)
  const handleTabChange = (value: string) => {
    onTabChange(Number(value))
  }

  return (
    <div className='flex items-center justify-between px-6 pb-4 border-b'>
      {plannedDates.length > 0 ? (
        <Tabs value={activeTabString} onValueChange={handleTabChange} className='w-full'>
          <TabsList>
            {plannedDates.map((date, index) => (
              <TabsTrigger
                key={`planned-date-${index}-${date || 'no-date'}`}
                value={String(index)}
              >
                FS {index + 1} - ({date ? formatDate(date) : 'No Date'})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : (
        <div className='text-sm text-muted-foreground'>No Planned Dates</div>
      )}
      {onCreateNew && (
        <Button
          onClick={onCreateNew}
          disabled={isCreating || isReadOnly}
          className='ml-4 bg-destructive hover:bg-destructive/90'
        >
          <Plus className='mr-2 h-4 w-4' />
          {isCreating ? 'Creating...' : 'Create New'}
        </Button>
      )}
    </div>
  )
}

