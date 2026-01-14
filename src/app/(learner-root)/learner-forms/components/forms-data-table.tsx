'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetFormsListQuery } from '@/store/api/forms/formsApi'
import type { FormListItem } from '@/store/api/forms/types'
import { DataTablePagination } from '@/components/data-table-pagination'
import { useAppSelector } from '@/store/hooks'

export function FormsDataTable() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // For non-admin users, filter by their user_id
  const userId: string | number | undefined = user?.user_id
    ? typeof user.user_id === 'string' || typeof user.user_id === 'number'
      ? user.user_id
      : undefined
    : undefined

  const { data: formsData, isLoading } = useGetFormsListQuery(
    {
      page,
      page_size: pageSize,
      user_id: userId,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  )

  const handleApply = useCallback(
    (row: FormListItem) => {
      router.push(`/learner-forms/${row.id}/submit`)
    },
    [router]
  )

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const formatDate = (date: string) => {
    if (!date) return ''
    return format(new Date(date), 'dd MMM yyyy')
  }

  const columns: ColumnDef<FormListItem>[] = useMemo(
    () => [
      {
        accessorKey: 'form_name',
        header: 'Form Name',
        cell: ({ row }) => (
          <div className='font-medium'>{row.original.form_name}</div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className='max-w-[300px] truncate text-muted-foreground'>
            {row.original.description || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant='outline'>{row.original.type}</Badge>,
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => handleApply(row.original)}
            >
              <Eye className='h-4 w-4' />
            </Button>
          </div>
        ),
      },
    ],
    [handleApply]
  )

  const table = useReactTable({
    data: formsData?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
    pageCount: formsData?.meta_data?.pages || 0,
  })

  return (
    <div className='space-y-4'>
      {/* Table */}
      <div className='rounded-md border'>
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  No forms found.
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
        currentPage={page}
        totalPages={formsData?.meta_data?.pages || 0}
        totalItems={formsData?.meta_data?.items || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
