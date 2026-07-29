/**
 * @deprecated Prefer dashboard/reports shared architecture.
 * Thin compatibility re-exports kept for any external imports.
 */
export {
  getNestedValue,
  resolveFromPaths,
  resolveMainAimAssessor,
  computeOverallTimeline,
  computeWeeksSinceLastReview,
  parsePercentage,
} from '../reports/lib/resolve-cell'

export { COMMON_REPORT_COLUMNS as LOCKER_REPORT_COLUMNS } from '../reports/columns/common-report-columns'

import { COMMON_REPORT_COLUMNS } from '../reports/columns/common-report-columns'
import { buildReportCsv } from '../reports/lib/build-report-csv'
import { flattenRow, flattenRows } from '../reports/lib/flatten-rows'
import { escapeCsvCell } from '@/utils/csv-export-helpers'

export function flattenRowForCsv(row: Record<string, unknown>) {
  return flattenRow(row, COMMON_REPORT_COLUMNS)
}

export function buildLockerReportCsvRows(
  rows: Record<string, unknown>[],
): { headers: string; dataRows: string[] } {
  const flatRows = flattenRows(rows, COMMON_REPORT_COLUMNS)
  const headers = COMMON_REPORT_COLUMNS.map((col) =>
    escapeCsvCell(col.header),
  ).join(',')
  const dataRows = flatRows.map((row) =>
    COMMON_REPORT_COLUMNS.map((col) =>
      escapeCsvCell(row[col.header] ?? ''),
    ).join(','),
  )
  return { headers, dataRows }
}

export function buildLockerReportCsv(rows: Record<string, unknown>[]): string {
  return buildReportCsv(COMMON_REPORT_COLUMNS, rows)
}
