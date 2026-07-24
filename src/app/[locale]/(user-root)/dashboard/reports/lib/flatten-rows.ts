import type { ReportColumnDef, ReportFlatRow } from '../types'
import { resolveColumnCell } from './resolve-cell'

export function flattenRow(
  row: Record<string, unknown>,
  columns: ReportColumnDef[],
): ReportFlatRow {
  const result: ReportFlatRow = {}
  for (const column of columns) {
    result[column.header] = resolveColumnCell(row, column)
  }
  return result
}

export function flattenRows(
  rows: Record<string, unknown>[],
  columns: ReportColumnDef[],
): ReportFlatRow[] {
  return rows.map((row) => flattenRow(row, columns))
}
