'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Download, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination } from '@/components/data-table-pagination'
import { useGetAwaitingSignatureListQuery } from '@/store/api/awaiting-signature/awaitingSignatureApi'
import type {
  AwaitingSignatureEntry,
  Signature,
} from '@/store/api/awaiting-signature/types'
import { useCachedUsersByRole } from '@/store/hooks/useCachedUsersByRole'
import { useGetCoursesQuery } from '@/store/api/course/courseApi'
import { useDebounce } from '@/hooks/use-debounce'
import {
  exportAwaitingSignatureToCSV,
  downloadCSV,
  generateAwaitingSignatureFilename,
} from '../utils/csv-export'
import { toast } from 'sonner'
import type { User } from '@/store/api/user/types'
import type { Course } from '@/store/api/course/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface FilterState {
  trainer: string
  course: string
  learner: string
}

const DEFAULT_FILTER_VALUE = 'all'

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return format(date, 'dd/MM/yyyy')
  } catch {
    return '-'
  }
}

const getSignatureStatus = (signature: Signature | undefined): string => {
  if (!signature) return '-'
  const requested = signature.requestedAt
    ? `R: ${formatDate(signature.requestedAt)}`
    : ''
  const signed = signature.signedAt
    ? `S: ${formatDate(signature.signedAt)}`
    : ''
  return signed ? `${requested} ${signed}` : requested || '-'
}

const isSignaturePending = (signature: Signature | undefined): boolean => {
  if (!signature) return false
  return !!signature.is_requested && !signature.isSigned
}

export function AwaitingSignatureDataTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<FilterState>({
    trainer: DEFAULT_FILTER_VALUE,
    course: DEFAULT_FILTER_VALUE,
    learner: '',
  })
  const [learnerSearch, setLearnerSearch] = useState('')
  const debouncedLearner = useDebounce(learnerSearch, 500)

  // Fetch dropdown data
  const { data: trainerUsers, isLoading: loadingTrainers } =
    useCachedUsersByRole('Trainer')
  const { data: coursesData, isLoading: loadingCourses } = useGetCoursesQuery({
    page: 1,
    page_size: 1000,
  })

  // Transform API data for dropdowns
  const trainers =
    trainerUsers?.data?.map((user: User) => ({
      id: user.user_id?.toString() || '',
      name:
        `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
        user.user_name ||
        'Unknown',
    })) || []

  const courses =
    coursesData?.data?.map((course: Course) => ({
      id: course.course_id?.toString() || '',
      name: course.course_name || 'Unknown',
    })) || []

  // API query
  const {
    data: awaitingSignatureData,
    isLoading,
    error,
  } = useGetAwaitingSignatureListQuery({
    page: currentPage,
    limit: pageSize,
    assessor_id:
      filters.trainer && filters.trainer !== 'all'
        ? filters.trainer
        : undefined,
    course_id:
      filters.course && filters.course !== 'all' ? filters.course : undefined,
    learner_name: debouncedLearner || undefined,
    meta: true,
  })

  const data = useMemo(
    () => awaitingSignatureData?.data || [],
    [awaitingSignatureData]
  )
  const metaData = useMemo(
    () => ({
      page: awaitingSignatureData?.page || 1,
      pages: awaitingSignatureData?.pages || 1,
      items: awaitingSignatureData?.total || 0,
    }),
    [awaitingSignatureData]
  )

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      trainer: DEFAULT_FILTER_VALUE,
      course: DEFAULT_FILTER_VALUE,
      learner: '',
    })
    setLearnerSearch('')
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export')
      return
    }

    try {
      const csvContent = exportAwaitingSignatureToCSV(data)
      const filename = generateAwaitingSignatureFilename()
      downloadCSV(csvContent, filename)
      toast.success('Data exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data. Please try again.')
    }
  }

  const columns: ColumnDef<AwaitingSignatureEntry>[] = useMemo(
    () => [
      {
        accessorKey: 'learner.name',
        header: 'Learner Name',
        cell: ({ row }) => row.original.learner?.name || '-',
      },
      {
        accessorKey: 'course.name',
        header: 'Course Name',
        cell: ({ row }) => row.original.course?.name || '-',
      },
      {
        accessorKey: 'signatures.Employer.name',
        header: 'Employer Name',
        cell: ({ row }) => row.original.signatures?.Employer?.name || '-',
      },
      {
        accessorKey: 'signatures.Trainer.name',
        header: 'Trainer Name',
        cell: ({ row }) => row.original.signatures?.Trainer?.name || '-',
      },
      {
        accessorKey: 'file_type',
        header: 'File Type',
        cell: ({ row }) => {
          const fileType = row.original.file_type || '-'
          return (
            <Badge
              variant={fileType === 'Evidence' ? 'default' : 'secondary'}
              className='capitalize'
            >
              {fileType}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'file_name',
        header: 'File Name',
        cell: ({ row }) => (
          <div
            className='max-w-[200px] truncate'
            title={row.original.file_name}
          >
            {row.original.file_name || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'file_description',
        header: 'File Description',
        cell: ({ row }) => (
          <div
            className='max-w-[200px] truncate'
            title={row.original.file_description}
          >
            {row.original.file_description || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'uploaded_at',
        header: 'Date File was uploaded',
        cell: ({ row }) => formatDate(row.original.uploaded_at),
      },
      {
        accessorKey: 'signatures.Trainer',
        header: 'Trainer Signed',
        cell: ({ row }) => {
          const signature = row.original.signatures?.Trainer
          const isPending = isSignaturePending(signature)
          return (
            <span className={isPending ? 'text-destructive font-medium' : ''}>
              {getSignatureStatus(signature)}
            </span>
          )
        },
      },
      {
        accessorKey: 'signatures.Learner',
        header: 'Learner Signed',
        cell: ({ row }) => {
          const signature = row.original.signatures?.Learner
          const isPending = isSignaturePending(signature)
          return (
            <span className={isPending ? 'text-destructive font-medium' : ''}>
              {getSignatureStatus(signature)}
            </span>
          )
        },
      },
      {
        accessorKey: 'signatures.Employer',
        header: 'Employer Signed',
        cell: ({ row }) => {
          const signature = row.original.signatures?.Employer
          const isPending = isSignaturePending(signature)
          return (
            <span className={isPending ? 'text-destructive font-medium' : ''}>
              {getSignatureStatus(signature)}
            </span>
          )
        },
      },
      {
        accessorKey: 'signatures.IQA',
        header: 'IQA Signed',
        cell: ({ row }) => {
          const signature = row.original.signatures?.IQA
          const isPending = isSignaturePending(signature)
          return (
            <span className={isPending ? 'text-destructive font-medium' : ''}>
              {getSignatureStatus(signature)}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: metaData.pages,
  })

  const pendingCount = useMemo(() => {
    return data.filter(
      (row) =>
        isSignaturePending(row.signatures?.Trainer) ||
        isSignaturePending(row.signatures?.Learner) ||
        isSignaturePending(row.signatures?.Employer) ||
        isSignaturePending(row.signatures?.IQA)
    ).length
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Awaiting Signature List</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Filters */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Filter by Trainer</label>
            <Select
              value={filters.trainer}
              onValueChange={(value) => handleFilterChange('trainer', value)}
              disabled={loadingTrainers}
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_FILTER_VALUE}>All</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Filter by Course</label>
            <Select
              value={filters.course}
              onValueChange={(value) => handleFilterChange('course', value)}
              disabled={loadingCourses}
            >
              <SelectTrigger>
                <SelectValue placeholder='All' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_FILTER_VALUE}>All</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Search by Learner</label>
            <div className='relative'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Enter learner name'
                value={learnerSearch}
                onChange={(e) => {
                  setLearnerSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className='pl-8'
              />
            </div>
          </div>

          <div className='flex items-end gap-2'>
            <Button variant='outline' onClick={clearFilters} className='w-full'>
              <X className='mr-2 h-4 w-4' />
              Clear
            </Button>
            <Button
              onClick={exportToCSV}
              disabled={!data || data.length === 0}
              className='w-full'
            >
              <Download className='mr-2 h-4 w-4' />
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <Alert className='text-destructive'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load data. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className='rounded-md border'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <Skeleton className='h-4 w-full' />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className='hover:bg-muted/50'>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='h-24 text-center'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <p className='text-muted-foreground font-medium'>
                          No files awaiting signature
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {data.length > 0 && (
          <DataTablePagination
            table={table}
            manualPagination
            currentPage={currentPage}
            totalPages={metaData.pages}
            totalItems={metaData.items}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Summary */}
        {data.length > 0 && (
          <div className='rounded-lg border bg-muted/50 p-4 space-y-1'>
            <p className='text-sm text-muted-foreground'>
              Total Signatures:{' '}
              <strong className='text-foreground'>{data.length}</strong>
            </p>
            <p className='text-sm text-muted-foreground'>
              Files with pending signatures:{' '}
              <strong className='text-foreground'>{pendingCount}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
