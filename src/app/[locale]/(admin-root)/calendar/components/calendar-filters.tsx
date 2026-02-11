'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Calendar as CalendarIcon, List } from 'lucide-react'
import { SortByVisitDateDropdown } from './sort-by-visit-date-dropdown'
import type { SessionFilters } from '@/store/api/session/types'
import { useCachedUsersByRole } from '@/store/hooks/useCachedUsersByRole'
import { useAppSelector } from '@/store/hooks'

interface CalendarFiltersProps {
  viewMode: 'calendar' | 'list'
  onViewModeChange: (mode: 'calendar' | 'list') => void
  onFilterChange: (filters: Partial<SessionFilters>) => void
  filters: SessionFilters
  onExportCSV: () => void
  isLoading?: boolean
}

export function CalendarFilters({
  viewMode,
  onViewModeChange,
  onFilterChange,
  filters,
  onExportCSV,
  isLoading,
}: CalendarFiltersProps) {
  const { user } = useAppSelector((state) => state.auth)
  const isAdmin = user?.role === 'Admin'
  const isTrainer = user?.role === 'Trainer'
  // Fetch trainers for the dropdown
  const { data: trainersData, isLoading: isTrainersLoading } =
    useCachedUsersByRole('Trainer', {
      skip: isTrainer,
    })

  const handleTrainerChange = (value: string) => {
    onFilterChange({ trainer_id: value === 'all' ? undefined : value })
  }

  const handleAttendedChange = (value: string) => {
    onFilterChange({ Attended: value === 'all' ? undefined : value })
  }

  const handleSortChange = (order: 'asc' | 'desc') => {
    onFilterChange({ sortBy: order })
  }

  return (
    <Card className='p-4 bg-linear-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-950/20 dark:to-teal-950/15 border-emerald-200/40 dark:border-emerald-800/20'>
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
        {/* Filter Controls */}
        <div className='flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto'>
          {/* Trainer Filter */}
          {isAdmin && (
            <Select
              value={filters.trainer_id || 'all'}
              onValueChange={handleTrainerChange}
            >
              <SelectTrigger className='w-full sm:w-[200px]'>
                <SelectValue placeholder='Search by Trainer' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Trainers</SelectItem>
                {isTrainersLoading ? (
                  <SelectItem value='loading' disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  trainersData?.data?.map((trainer) => (
                    <SelectItem
                      key={trainer.user_id}
                      value={trainer.user_id.toString()}
                    >
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          {/* Attended Status Filter */}
          <Select
            value={filters.Attended || 'all'}
            onValueChange={handleAttendedChange}
          >
            <SelectTrigger className='w-full sm:w-[200px]'>
              <SelectValue placeholder='Search by Attended' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='Not Set'>Not Set</SelectItem>
              <SelectItem value='Attended'>Attended</SelectItem>
              <SelectItem value='Cancelled'>Cancelled</SelectItem>
              <SelectItem value='Cancelled by Assessor'>
                Cancelled by Assessor
              </SelectItem>
              <SelectItem value='Cancelled by Learner'>
                Cancelled by Learner
              </SelectItem>
              <SelectItem value='Cancelled by Employer'>
                Cancelled by Employer
              </SelectItem>
              <SelectItem value='Learner Late'>Learner Late</SelectItem>
              <SelectItem value='Assessor Late'>Assessor Late</SelectItem>
              <SelectItem value='Learner not Attended'>
                Learner not Attended
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort by Visit Date */}
          <SortByVisitDateDropdown
            value={filters.sortBy}
            onChange={handleSortChange}
          />
        </div>

        {/* View Toggle and Export */}
        <div className='flex gap-2 items-center w-full md:w-auto'>
          <div className='flex border rounded-md'>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onViewModeChange('calendar')}
              className='rounded-r-none'
            >
              <CalendarIcon className='h-4 w-4 mr-2' />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => onViewModeChange('list')}
              className='rounded-l-none'
            >
              <List className='h-4 w-4 mr-2' />
              List
            </Button>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={onExportCSV}
            disabled={isLoading}
          >
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
        </div>
      </div>
    </Card>
  )
}
