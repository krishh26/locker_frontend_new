'use client'

import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table-pagination'
import { cn } from '@/lib/utils'
import type { ReportColumnDef, ReportFlatRow } from '../types'
import { buildReportColumnDefs } from '../lib/build-report-column-defs'

export interface ReportDataTableProps {
  columns: ReportColumnDef[]
  data: ReportFlatRow[]
  isLoading?: boolean
  className?: string
}

export function ReportDataTable({
  columns,
  data,
  isLoading = false,
  className,
}: ReportDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columnDefs = useMemo(
    () => buildReportColumnDefs(columns),
    [columns],
  )

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className='h-9 w-64' />
        <Skeleton className='h-64 w-full' />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='relative max-w-sm'>
        <Search className='absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder='Search report…'
          className='pl-8'
        />
      </div>

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      className='whitespace-nowrap bg-muted/40'
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type='button'
                          className='inline-flex items-center gap-1 font-medium hover:text-foreground'
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === 'asc' ? (
                            <ArrowUp className='h-3.5 w-3.5' />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className='h-3.5 w-3.5' />
                          ) : (
                            <ArrowUpDown className='h-3.5 w-3.5 opacity-40' />
                          )}
                        </button>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className='max-w-[220px] truncate whitespace-nowrap text-sm'
                      title={String(cell.getValue() ?? '')}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
