'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('resources')
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

  const getJobTypeLabel = useCallback(
    (value: string | undefined) => {
      switch (value) {
        case 'On':
          return t('options.jobType.on')
        case 'Off':
          return t('options.jobType.off')
        default:
          return value ?? t('common.dash')
      }
    },
    [t]
  )

  const getResourceTypeLabel = useCallback(
    (value: string | undefined) => {
      switch (value?.toUpperCase()) {
        case 'PDF':
          return t('options.resourceType.pdf')
        case 'WORD':
          return t('options.resourceType.word')
        case 'PPT':
          return t('options.resourceType.ppt')
        case 'TEXT':
          return t('options.resourceType.text')
        case 'IMAGE':
          return t('options.resourceType.image')
        default:
          return value ?? t('common.dash')
      }
    },
    [t]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !confirm(
          `${t('table.confirm.deleteTitle')}\n\n${t('table.confirm.deleteBody')}`
        )
      ) {
        return
      }

      try {
        await deleteResource(id).unwrap()
        toast.success(t('table.toast.deleted'))
        refetch()
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'data' in error
            ? (error as { data?: { error?: string } }).data?.error
            : undefined
        toast.error(errorMessage || t('table.toast.deleteFailed'))
      }
    },
    [deleteResource, refetch, t]
  )

  const getJobTypeColor = (jobType: string | undefined) => {
    switch (jobType) {
      case 'On':
        return 'text-white bg-primary'
      case 'Off':
        return 'text-white bg-secondary'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getResourceTypeColor = (resourceType: string | undefined) => {
    switch (resourceType?.toUpperCase()) {
      case 'PDF':
        return 'text-white bg-destructive'
      case 'WORD':
        return 'text-white bg-primary'
      case 'PPT':
        return 'text-white bg-secondary'
      case 'IMAGE':
        return 'text-white bg-accent'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const exactFilter = (row: Row<Resource>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<Resource>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('table.columns.name'),
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
        header: t('table.columns.description'),
        cell: ({ row }) => {
          const description = row.getValue('description') as string
          return (
            <span className='text-sm max-w-md truncate block'>
              {description || t('common.dash')}
            </span>
          )
        },
      },
      {
        id: 'glh',
        header: t('table.columns.glh'),
        cell: ({ row }) => {
          const resource = row.original
          const hours = resource.hours
          const minutes = resource.minute

          if (hours === null || hours === undefined || hours === '') {
            return <span className='font-medium'>{t('common.dash')}</span>
          }

          const hoursStr = String(hours || 0)
          const minutesStr = String(minutes || 0)
          const glhValue = t('common.glhFormat', {
            hours: hoursStr,
            minutes: minutesStr,
          })

          return <span className='font-medium'>{glhValue}</span>
        },
      },
      {
        accessorKey: 'job_type',
        header: t('table.columns.jobType'),
        cell: ({ row }) => {
          const jobType = row.getValue('job_type') as string
          if (!jobType) return <span>{t('common.dash')}</span>
          return (
            <Badge variant='secondary' className={getJobTypeColor(jobType)}>
              {getJobTypeLabel(jobType)}
            </Badge>
          )
        },
        filterFn: exactFilter,
      },
      {
        accessorKey: 'resource_type',
        header: t('table.columns.resourceType'),
        cell: ({ row }) => {
          const resourceType = row.getValue('resource_type') as string
          if (!resourceType) return <span>{t('common.dash')}</span>
          return (
            <Badge
              variant='secondary'
              className={getResourceTypeColor(resourceType)}
            >
              {getResourceTypeLabel(resourceType)}
            </Badge>
          )
        },
        filterFn: exactFilter,
      },
      {
        id: 'actions',
        header: t('table.columns.actions'),
        cell: ({ row }) => {
          const resource = row.original
          const resourceId = String(resource.resource_id || resource.id || '')
          const resourceUrl = resource.url?.url
          const isLearner = user?.role === 'Learner'

          // For learners, show only eye icon if URL exists
          if (isLearner) {
            if (!resourceUrl) {
              return (
                <span className='text-muted-foreground text-sm'>
                  {t('common.dash')}
                </span>
              )
            }
            return (
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 cursor-pointer'
                onClick={() => window.open(resourceUrl, '_blank')}
              >
                <Eye className='size-4' />
                <span className='sr-only'>{t('table.buttons.view')}</span>
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
                  <span className='sr-only'>{t('table.buttons.view')}</span>
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
                  <span className='sr-only'>{t('table.buttons.edit')}</span>
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
                      <span className='sr-only'>{t('table.columns.actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {resourceUrl && (
                      <DropdownMenuItem
                        className='cursor-pointer'
                        onClick={() => window.open(resourceUrl, '_blank')}
                      >
                        <Download className='mr-2 size-4' />
                        {t('table.buttons.download')}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant='destructive'
                      className='cursor-pointer'
                      onClick={() => handleDelete(resourceId)}
                    >
                      <Trash2 className='mr-2 size-4' />
                      {t('table.buttons.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        },
      },
    ],
    [
      getJobTypeLabel,
      getResourceTypeLabel,
      handleDelete,
      isEmployer,
      t,
      user?.role,
    ]
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
        <div className='text-muted-foreground'>{t('table.states.loading')}</div>
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
              placeholder={t('table.searchPlaceholder')}
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
              {jobType
                ? `${t('table.filters.jobType.label')}: ${getJobTypeLabel(jobType)}`
                : `${t('table.filters.jobType.label')}: ${t('options.jobType.on')}/${t(
                    'options.jobType.off'
                  )}`}
            </Label>
          </div>
          <div className='space-y-2'>
            <Label
              htmlFor='resource-type-filter'
              className='text-sm font-medium'
            >
              {t('table.columns.resourceType')}
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
                <SelectValue placeholder={t('table.filters.resourceType.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {t('table.filters.resourceType.allTypes')}
                </SelectItem>
                <SelectItem value='PDF'>{t('options.resourceType.pdf')}</SelectItem>
                <SelectItem value='WORD'>{t('options.resourceType.word')}</SelectItem>
                <SelectItem value='PPT'>{t('options.resourceType.ppt')}</SelectItem>
                <SelectItem value='Text'>{t('options.resourceType.text')}</SelectItem>
                <SelectItem value='Image'>{t('options.resourceType.image')}</SelectItem>
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
                  {t('table.buttons.addResource')}
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
                  {t('table.states.empty')}
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
