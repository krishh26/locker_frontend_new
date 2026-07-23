'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { ReportColumnDef, ReportFlatRow } from '../types'

export function buildReportColumnDefs(
  columns: ReportColumnDef[],
): ColumnDef<ReportFlatRow, string>[] {
  return columns.map((column) => ({
    id: column.id,
    accessorKey: column.header,
    header: column.header,
    cell: ({ getValue }) => String(getValue() ?? 'N/A'),
    enableSorting: true,
  }))
}
