import type { ReportColumnDef } from '../types'
import { resolveFromPaths } from '../lib/resolve-cell'

/** Shared extras for session-action reports — do not redefine per config. */
export const ACTION_NAME_COLUMN: ReportColumnDef = {
  id: 'actions',
  header: 'Actions',
  accessor: (row) =>
    resolveFromPaths(row, ['action_name', 'Actions', 'action']),
}

export const ACTION_DUE_DATE_COLUMN: ReportColumnDef = {
  id: 'action_due_date',
  header: 'Action Due Date',
  accessor: (row) =>
    resolveFromPaths(row, ['target_date', 'action_due_date', 'due_date']),
  format: 'date',
}
