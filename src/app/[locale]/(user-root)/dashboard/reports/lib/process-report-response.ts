import type { ReportColumnDef, ReportFlatRow } from '../types'
import { flattenRows } from './flatten-rows'
import { buildReportCsvFromFlatRows } from './build-report-csv'
import type { ReportConfig } from '../types'

export function extractCardDataArray(res: unknown): unknown[] {
  if (!res || typeof res !== 'object') return []

  const record = res as Record<string, unknown>

  if (Array.isArray(record.data)) return record.data
  if (Array.isArray(record.learners)) return record.learners
  if (Array.isArray(record.list)) return record.list

  const arrayValue = Object.values(record).find((v) => Array.isArray(v))
  return arrayValue ? (arrayValue as unknown[]) : []
}

export function processReportResponse(
  config: ReportConfig,
  response: unknown,
): {
  flatRows: ReportFlatRow[]
  summaryLines: string[]
  csv: string
  columns: ReportColumnDef[]
} {
  const raw = extractCardDataArray(response)
  const normalize = config.normalizeRows ?? ((rows: unknown[]) =>
    rows.filter(
      (row): row is Record<string, unknown> =>
        row != null && typeof row === 'object' && !Array.isArray(row),
    ))
  const normalized = normalize(raw)
  const filtered = config.filterRows
    ? config.filterRows(normalized)
    : normalized
  const columns = config.resolveColumns
    ? config.resolveColumns(filtered)
    : config.columns
  const flatRows = flattenRows(filtered, columns)
  const summaryLines = config.buildSummaryLines?.(response) ?? []
  const csv = buildReportCsvFromFlatRows(columns, flatRows, summaryLines)
  return { flatRows, summaryLines, csv, columns }
}
