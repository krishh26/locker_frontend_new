import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { ACTION_NAME_COLUMN } from '../columns/action-report-columns'
import { normalizeSessionActionRows } from '../lib/normalize/session-actions'

/**
 * Due actions — common columns + Actions.
 * Learner set is scoped by apiType `session_learner_action_due` (due today).
 */
export const dueActionsReport: ReportConfig = {
  id: 'due_actions',
  apiType: 'session_learner_action_due',
  titleKey: 'due_actions',
  columns: [...COMMON_REPORT_COLUMNS, ACTION_NAME_COLUMN],
  normalizeRows: normalizeSessionActionRows,
}
