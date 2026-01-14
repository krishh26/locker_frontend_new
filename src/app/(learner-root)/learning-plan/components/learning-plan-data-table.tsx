'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Download, Search, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { format, addMinutes } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  useGetLearnerPlanListQuery,
  useUpdateSessionMutation,
} from '@/store/api/learner-plan/learnerPlanApi'
import { useAppSelector } from '@/store/hooks'
import { toast } from 'sonner'
import type { LearningPlanSession } from '@/store/api/learner-plan/types'
import { DataTablePagination } from '@/components/data-table-pagination'
import { SessionExpandedContent } from './session-expanded-content'

export type SessionRow = {
  id: number
  sessionNo: number
  title: string
  description?: string
  startDate: string
  dateFormatted: string
  timeStart: string
  timeEnd: string
  type: string
  assessor: string
  attended: string
  courses: string
  feedback: string
  units: Array<{
    unit_id: string | number | null
    unit_name: string | null
  }>
  rawData: LearningPlanSession
}

const sessionTypes = [
  'All',
  'General',
  'Induction',
  'Formal Review',
  'Telephone',
  'Exit Session',
  'Out Of the Workplace',
  'Tests/Exams',
  'Learner Support',
  'Initial Session',
  'Gateway Ready',
  'EPA',
  'Furloughed',
]

const attendedStatuses = [
  'All',
  'Cancelled',
  'Cancelled by Trainer',
  'Cancelled by Employee',
  'Learner not Attended',
]

export function LearningPlanDataTable() {
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [attendedFilter, setAttendedFilter] = useState<string>('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const learnerId = learner?.learner_id || user?.id

  const { data, isLoading } = useGetLearnerPlanListQuery(
    {
      learners: learnerId || '',
      type: typeFilter || undefined,
      Attended: attendedFilter || undefined,
      meta: true,
    },
    {
      skip: !learnerId,
    }
  )

  const [updateSession] = useUpdateSessionMutation()

  const handleUpdateSubmit = useCallback(
    async (payload: {
      id: number
      Attended?: string | null
      feedback?: string
    }) => {
      try {
        await updateSession(payload).unwrap()
        toast.success('Session updated successfully')
      } catch (error) {
        console.error(error)
        toast.error('Failed to update session')
      }
    },
    [updateSession]
  )

  const tableData: SessionRow[] = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return []
    }

    return data.data.map((item) => {
      const minutes = Number(item.Duration) || 0
      const startDate = new Date(item.startDate)
      const endDate = addMinutes(startDate, minutes)

      // Get learner-specific course mapping
      const learnerMapping = item.participant_course_mapping?.find(
        (mapping) => mapping.learner_id.toString() === learnerId?.toString()
      )
      const allowedCourseIds = learnerMapping?.courses || []

      // Filter courses for the learner
      const learnerCourses =
        item.courses?.filter((course) =>
          allowedCourseIds.includes(course.course_id)
        ) || []

        // Get units for display
        const units = learnerCourses.flatMap((course) =>
          (course.units || []).map((unit) => ({
            unit_id: unit.unit_id || null,
            unit_name: unit.unit_name || null,
          }))
        )

        return {
          id: item.learner_plan_id,
          sessionNo: item.learner_plan_id,
          title: item.title,
          description: item.description,
          startDate: item.startDate,
          dateFormatted: format(startDate, 'dd/MM/yyyy'),
          timeStart: format(startDate, 'HH:mm'),
          timeEnd: format(endDate, 'HH:mm'),
          type: item.type || '',
          assessor: item.assessor_id?.user_name || '',
          attended: item.Attended || '',
          courses: learnerCourses.map((c) => c.course_name).join(', '),
          feedback: item.feedback || 'Neutral',
          units: units,
          rawData: item,
        }
    })
  }, [data, learnerId])

  const filteredData = useMemo(() => {
    let filtered = tableData

    if (globalFilter) {
      const filter = globalFilter.toLowerCase()
      filtered = filtered.filter(
        (row) =>
          row.title.toLowerCase().includes(filter) ||
          row.type.toLowerCase().includes(filter) ||
          row.courses.toLowerCase().includes(filter) ||
          row.assessor.toLowerCase().includes(filter)
      )
    }

    return filtered
  }, [tableData, globalFilter])

  const toggleRowExpansion = (sessionNo: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sessionNo)) {
        newSet.delete(sessionNo)
      } else {
        newSet.add(sessionNo)
      }
      return newSet
    })
  }


  const columns: ColumnDef<SessionRow>[] = useMemo(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => {
          const isExpanded = expandedRows.has(row.original.sessionNo)
          return (
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              onClick={() => toggleRowExpansion(row.original.sessionNo)}
            >
              {isExpanded ? (
                <ChevronDown className='h-4 w-4' />
              ) : (
                <ChevronRight className='h-4 w-4' />
              )}
            </Button>
          )
        },
        size: 40,
      },
      {
        accessorKey: 'sessionNo',
        header: 'Session No',
        cell: ({ row }) => (
          <div className='font-medium'>{row.getValue('sessionNo')}</div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <div className='font-medium max-w-[200px] truncate'>
            {row.getValue('title')}
          </div>
        ),
      },
      {
        accessorKey: 'dateFormatted',
        header: 'Date',
        cell: ({ row }) => (
          <div className='text-sm'>{row.getValue('dateFormatted')}</div>
        ),
      },
      {
        accessorKey: 'timeStart',
        header: 'Time',
        cell: ({ row }) => {
          const start = row.getValue('timeStart') as string
          const end = row.original.timeEnd
          return (
            <div className='text-sm'>
              {start} - {end}
            </div>
          )
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const type = row.getValue('type') as string
          return (
            <Badge variant='secondary' className='capitalize'>
              {type}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'assessor',
        header: 'Assessor',
        cell: ({ row }) => (
          <div className='text-sm'>{row.getValue('assessor') || '-'}</div>
        ),
      },
      {
        accessorKey: 'attended',
        header: 'Attended',
        cell: ({ row }) => {
          const attended = row.getValue('attended') as string | null
          const sessionId = row.original.id
          return (
            <Select
              value={attended || undefined}
              onValueChange={(value) => {
                handleUpdateSubmit({
                  id: sessionId,
                  Attended: value || null,
                })
              }}
              disabled={user?.role === 'Learner'}
            >
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder='Select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Attended'>Attended</SelectItem>
                <SelectItem value='Cancelled'>Cancelled</SelectItem>
                <SelectItem value='Cancelled by Trainer'>
                  Cancelled by Trainer
                </SelectItem>
                <SelectItem value='Cancelled by Learner'>
                  Cancelled by Learner
                </SelectItem>
                <SelectItem value='Cancelled by Employee'>
                  Cancelled by Employee
                </SelectItem>
                <SelectItem value='Learner not Attended'>
                  Learner not Attended
                </SelectItem>
              </SelectContent>
            </Select>
          )
        },
      },
      {
        accessorKey: 'courses',
        header: 'Courses',
        cell: ({ row }) => (
          <div className='text-sm max-w-[200px] truncate'>
            {row.getValue('courses') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'feedback',
        header: 'Feedback',
        cell: ({ row }) => {
          const feedback = row.getValue('feedback') as string
          const sessionId = row.original.id
          const isAdminOrTrainer =
            user?.role === 'Admin' || user?.role === 'Trainer'

          return (
            <div className='flex items-center gap-1'>
              <Button
                variant={feedback === 'Good' ? 'default' : 'ghost'}
                size='icon'
                className='h-8 w-8'
                disabled={isAdminOrTrainer}
                onClick={() => {
                  if (isAdminOrTrainer) return
                  handleUpdateSubmit({
                    id: sessionId,
                    feedback: 'Good',
                  })
                }}
              >
                <span className='text-base'>🙂</span>
              </Button>
              <Button
                variant={feedback === 'Neutral' ? 'default' : 'ghost'}
                size='icon'
                className='h-8 w-8'
                disabled={isAdminOrTrainer}
                onClick={() => {
                  if (isAdminOrTrainer) return
                  handleUpdateSubmit({
                    id: sessionId,
                    feedback: 'Neutral',
                  })
                }}
              >
                <span className='text-base'>😐</span>
              </Button>
              <Button
                variant={feedback === 'Bad' ? 'destructive' : 'ghost'}
                size='icon'
                className='h-8 w-8'
                disabled={isAdminOrTrainer}
                onClick={() => {
                  if (isAdminOrTrainer) return
                  handleUpdateSubmit({
                    id: sessionId,
                    feedback: 'Bad',
                  })
                }}
              >
                <span className='text-base'>😞</span>
              </Button>
            </div>
          )
        },
      },
    ],
    [expandedRows, user?.role, handleUpdateSubmit]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      globalFilter,
    },
  })

  const handleFilterChange = (
    value: string,
    setValue: (val: string) => void
  ) => {
    if (value === 'All') {
      setValue('')
    } else {
      setValue(value)
    }
  }

  const handleExportCsv = () => {
    toast.info('CSV export functionality will be implemented')
  }

  const handleExportPdf = () => {
    toast.info('PDF export functionality will be implemented')
  }

  if (isLoading) {
    return (
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-center py-12'>
          <p className='text-muted-foreground'>Loading sessions...</p>
        </div>
      </div>
    )
  }

  if (!learnerId) {
    return (
      <div className='w-full space-y-4'>
        <div className='flex items-center justify-center py-12'>
          <p className='text-muted-foreground'>No learner selected</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full space-y-4'>
      {/* Filters */}
      <Card>
        <CardContent className=''>
          <div className='flex flex-wrap gap-4 items-center justify-between'>
            <div className='space-y-2'>
              <Label htmlFor='learner-name' className='text-sm font-medium'>
                Learner
              </Label>
              <div className='pt-2 text-sm'>
                <strong>Name:</strong>{' '}
                <span className='capitalize'>
                  {learner?.first_name} {learner?.last_name}
                </span>
              </div>
            </div>
            <div className='flex flex-wrap gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='type-filter' className='text-sm font-medium'>
                  Type
                </Label>
                <Select
                  value={typeFilter || 'All'}
                  onValueChange={(value) =>
                    handleFilterChange(value, setTypeFilter)
                  }
                >
                  <SelectTrigger id='type-filter' className='cursor-pointer'>
                    <SelectValue placeholder='Select type' />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label
                  htmlFor='attended-filter'
                  className='text-sm font-medium'
                >
                  Attended Status
                </Label>
                <Select
                  value={attendedFilter || 'All'}
                  onValueChange={(value) =>
                    handleFilterChange(value, setAttendedFilter)
                  }
                >
                  <SelectTrigger
                    id='attended-filter'
                    className='cursor-pointer'
                  >
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {attendedStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Actions Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center space-x-2'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search sessions...'
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className='pl-9'
            />
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='cursor-pointer'>
                <Download className='mr-2 size-4' />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={handleExportCsv}
                className='cursor-pointer'
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPdf}
                className='cursor-pointer'
              >
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(user?.role === 'Admin' || user?.role === 'Trainer') && (
            <Button className='cursor-pointer'>
              <Plus className='mr-2 size-4' />
              Add Session
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredData.length > 0 ? (
        <>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const isExpanded = expandedRows.has(row.original.sessionNo)
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow data-state={row.getIsSelected() && 'selected'}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className='bg-muted/50 p-0'
                            >
                              <SessionExpandedContent
                                session={row.original.rawData}
                                units={row.original.units}
                                courses={row.original.courses}
                                description={row.original.description}
                                userRole={user?.role}
                                onRefresh={() => {
                                  // Refetch the data
                                  // The query will automatically refetch due to cache invalidation
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <DataTablePagination
            table={table}
            manualPagination={true}
            totalItems={data?.meta_data?.items}
            totalPages={data?.meta_data?.pages}
            pageSize={data?.meta_data?.page_size}
            currentPage={data?.meta_data?.page}
          />
        </>
      ) : (
        <Card>
          <CardContent className='p-12'>
            <div className='text-center text-muted-foreground'>
              No sessions available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
