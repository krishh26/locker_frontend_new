import type { CardApiType } from '@/store/api/dashboard/types'

export type ReportCellFormat =
  | 'text'
  | 'date'
  | 'datetime'
  | 'percent'
  | 'number'

export type ReportAccessor =
  | string
  | ((row: Record<string, unknown>) => unknown)

export interface ReportColumnDef {
  /** Stable key used for TanStack column id */
  id: string
  /** CSV + table header label (single source of truth) */
  header: string
  accessor: ReportAccessor
  format?: ReportCellFormat
}

export interface ReportConfig {
  /** Matches admin dashboard card id */
  id: string
  /** Omitted when the card has no backend type yet (e.g. OTJ Off Track) */
  apiType?: CardApiType
  /** i18n key under dashboard.admin.cards.* */
  titleKey: string
  /**
   * Static columns. For dynamic reports, use `resolveColumns` (may start as []).
   */
  columns: ReportColumnDef[]
  /**
   * Build final columns from normalized/filtered rows (e.g. dynamic course headers).
   * When set, replaces `columns` for flatten / CSV / table.
   */
  resolveColumns?: (
    rows: Record<string, unknown>[],
  ) => ReportColumnDef[]
  normalizeRows?: (raw: unknown[]) => Record<string, unknown>[]
  /**
   * Optional post-normalize filter. Prefer relying on apiType when the
   * backend already scopes the dataset (e.g. due today / next 7 days).
   */
  filterRows?: (
    rows: Record<string, unknown>[],
  ) => Record<string, unknown>[]
  buildSummaryLines?: (res: unknown) => string[]
}

/** Flattened row keyed by column header (used by table + CSV) */
export type ReportFlatRow = Record<string, string>
