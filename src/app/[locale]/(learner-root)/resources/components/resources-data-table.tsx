'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  ChevronDown,
  EllipsisVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Search,
  Plus,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { ResourceFormDialog } from './resource-form-dialog'
import { DataTablePagination } from '@/components/data-table-pagination'
import {
  useGetResourcesQuery,
  useDeleteResourceMutation,
  useExportResourcesPdfMutation,
  useExportResourcesCsvMutation,
} from '@/store/api/resources/resourcesApi'
import { toast } from 'sonner'
import { useAppSelector } from '@/store/hooks'
import type { Resource } from '@/store/api/resources/types'

export function ResourcesDataTable() {
  const user = useAppSelector((state) => state.auth.user)
  const isLearner = user?.role === 'Learner'
  const isEmployer = user?.role === 'Employer'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [jobType, setJobType] = useState<'On' | 'Off' | ''>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const debouncedSearch = useDebounce(searchKeyword, 500)

  const {
    data: resourcesResponse,
    isLoading,
    refetch,
  } = useGetResourcesQuery({
    page,
    page_size: pageSize,
    search: debouncedSearch,
    job_type: jobType === 'On' ? 'On' : '',
  })

  const [deleteResource] = useDeleteResourceMutation()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [editResource, setEditResource] = useState<Resource | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const resources = resourcesResponse?.data ?? []
  const metaData = resourcesResponse?.meta_data

  useEffect(() => {
    if (debouncedSearch !== searchKeyword) {
      setPage(1)
    }
  }, [debouncedSearch, searchKeyword])

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !confirm(
          'Are you sure you want to delete this resource? This action cannot be undone.'
        )
      ) {
        return
      }

      try {
        await deleteResource(id).unwrap()
        toast.success('Resource deleted successfully')
        refetch()
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'data' in error
            ? (error as { data?: { error?: string } }).data?.error
            : undefined
        toast.error(errorMessage || 'Failed to delete resource')
      }
    },
    [deleteResource, refetch]
  )

  const getJobTypeColor = (jobType: string | undefined) => {
    switch (jobType) {
      case 'On':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
      case 'Off':
        return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getResourceTypeColor = (resourceType: string | undefined) => {
    switch (resourceType?.toUpperCase()) {
      case 'PDF':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
      case 'WORD':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
      case 'PPT':
        return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20'
      case 'IMAGE':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const exactFilter = (row: Row<Resource>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<Resource>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const resource = row.original
          return (
            <div className='flex flex-col'>
              <span className='font-medium'>{resource.name}</span>
              {resource.description && (
                <span className='text-sm text-muted-foreground truncate max-w-md'>
                  {resource.description}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const description = row.getValue('description') as string
          return (
            <span className='text-sm max-w-md truncate block'>
              {description || '-'}
            </span>
          )
        },
      },
      {
        id: 'glh',
        header: 'GLH',
        cell: ({ row }) => {
          const resource = row.original
          const hours = resource.hours
          const minutes = resource.minute

          if (hours === null || hours === undefined || hours === '') {
            return <span className='font-medium'>-</span>
          }

          const hoursStr = String(hours || 0)
          const minutesStr = String(minutes || 0)
          const glhValue = `${hoursStr}h ${minutesStr} min`

          return <span className='font-medium'>{glhValue}</span>
        },
      },
      {
        accessorKey: 'job_type',
        header: 'Job Type',
        cell: ({ row }) => {
          const jobType = row.getValue('job_type') as string
          if (!jobType) return <span>-</span>
          return (
            <Badge variant='secondary' className={getJobTypeColor(jobType)}>
              {jobType}
            </Badge>
          )
        },
        filterFn: exactFilter,
      },
      {
        accessorKey: 'resource_type',
        header: 'Resource Type',
        cell: ({ row }) => {
          const resourceType = row.getValue('resource_type') as string
          if (!resourceType) return <span>-</span>
          return (
            <Badge
              variant='secondary'
              className={getResourceTypeColor(resourceType)}
            >
              {resourceType}
            </Badge>
          )
        },
        filterFn: exactFilter,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const resource = row.original
          const resourceId = String(resource.resource_id || resource.id || '')
          const resourceUrl = resource.url?.url
          const isLearner = user?.role === 'Learner'

          // For learners, show only eye icon if URL exists
          if (isLearner) {
            if (!resourceUrl) {
              return <span className='text-muted-foreground text-sm'>-</span>
            }
            return (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 cursor-pointer'
                onClick={() => window.open(resourceUrl, '_blank')}
              >
                <Eye className='size-4' />
                <span className='sr-only'>View resource</span>
              </Button>
            )
          }

          // For non-learners, show full actions menu
          return (
            <div className='flex items-center gap-2'>
              {resourceUrl && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 cursor-pointer'
                  onClick={() => window.open(resourceUrl, '_blank')}
                >
                  <Eye className='size-4' />
                  <span className='sr-only'>View resource</span>
                </Button>
              )}
              {!isEmployer && (
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 cursor-pointer'
                  onClick={() => {
                    setEditResource(resource)
                    setEditDialogOpen(true)
                  }}
                >
                  <Pencil className='size-4' />
                  <span className='sr-only'>Edit resource</span>
                </Button>
              )}
              {!isEmployer && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 cursor-pointer'
                    >
                      <EllipsisVertical className='size-4' />
                      <span className='sr-only'>More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {resourceUrl && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() => window.open(resourceUrl, '_blank')}
                      >
                        <Download className='mr-2 size-4' />
                        Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      className='cursor-pointer'
                      onClick={() => handleDelete(resourceId)}
                    >
                      <Trash2 className='mr-2 size-4' />
                      Delete Resource
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        },
      },
    ],
    [handleDelete, user?.role, isEmployer]
  )

  const table = useReactTable({
    data: resources,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: metaData?.pages ?? 0,
  })

  const resourceTypeFilter = table
    .getColumn('resource_type')
    ?.getFilterValue() as string

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-muted-foreground'>Loading resources...</div>
      </div>
    )
  }

  return (
    <div className='w-full space-y-4'>
      <div className='flex gap-4 items-center justify-between'>
        <div className='space-y-2'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search by name and description...'
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              className='pl-9'
            />
          </div>
        </div>
        <div className='flex items-center justify-end gap-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='job-type-switch'
              checked={jobType === 'On'}
              onCheckedChange={(checked) => {
                const newJobType = checked
                  ? 'On'
                  : jobType === 'Off'
                  ? ''
                  : 'Off'
                setJobType(newJobType)
                setPage(1)
              }}
            />
            <Label htmlFor='job-type-switch' className='text-sm'>
              {jobType ? `Job Type: ${jobType}` : 'Job Type: On/Off'}
            </Label>
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='resource-type-filter'
              className='text-sm font-medium'
            >
              Resource Type
            </Label>
            <Select
              value={resourceTypeFilter || ''}
              onValueChange={(value) =>
                table
                  .getColumn('resource_type')
                  ?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger
                className='cursor-pointer w-full'
                id='resource-type-filter'
              >
                <SelectValue placeholder='Select Resource Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='PDF'>PDF</SelectItem>
                <SelectItem value='WORD'>WORD</SelectItem>
                <SelectItem value='PPT'>PPT</SelectItem>
                <SelectItem value='Text'>Text</SelectItem>
                <SelectItem value='Image'>Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isLearner && !isEmployer && (
            <ResourceFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              onSuccess={() => {
                setDialogOpen(false)
                refetch()
              }}
              trigger={
                <Button type='button' className='cursor-pointer'>
                  <Plus className='mr-2 h-4 w-4' />
                  Create Resource
                </Button>
              }
            />
          )}
        </div>
      </div>

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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {metaData && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={page}
          totalPages={metaData.pages}
          totalItems={metaData.items}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize)
            setPage(1)
          }}
        />
      )}

      {/* Edit Resource Dialog */}
      <ResourceFormDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditResource(null)
        }}
        onSuccess={() => {
          setEditDialogOpen(false)
          setEditResource(null)
          refetch()
        }}
        resource={editResource}
        mode="edit"
      />
    </div>
  )
}
