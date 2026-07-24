import { buildCsvString } from '@/utils/csv-export-helpers'
import type { ReportColumnDef, ReportFlatRow } from '../types'
import { flattenRows } from './flatten-rows'

export function buildReportCsvFromFlatRows(
  columns: ReportColumnDef[],
  flatRows: ReportFlatRow[],
  summaryLines: string[] = [],
): string {
  const headerRow = columns.map((col) => col.header)
  const dataRows = flatRows.map((row) =>
    columns.map((col) => row[col.header] ?? ''),
  )

  const parts: string[] = []
  if (summaryLines.length > 0) {
    parts.push(summaryLines.join('\n'), '')
  }
  parts.push(buildCsvString([headerRow, ...dataRows]))
  return parts.join('\n')
}

export function buildReportCsv(
  columns: ReportColumnDef[],
  rows: Record<string, unknown>[],
  summaryLines: string[] = [],
): string {
  return buildReportCsvFromFlatRows(
    columns,
    flattenRows(rows, columns),
    summaryLines,
  )
}
