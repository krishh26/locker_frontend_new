import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import {
  ACTION_DUE_DATE_COLUMN,
  ACTION_NAME_COLUMN,
} from '../columns/action-report-columns'
import { normalizeSessionActionRows } from '../lib/normalize/session-actions'

/**
 * Overdue actions — common columns + Actions + Action Due Date.
 * Learner set is scoped by apiType `session_learner_action_overdue`.
 */
export const overdueActionsReport: ReportConfig = {
  id: 'overdue_actions',
  apiType: 'session_learner_action_overdue',
  titleKey: 'overdue_actions',
  columns: [
    ...COMMON_REPORT_COLUMNS,
    ACTION_NAME_COLUMN,
    ACTION_DUE_DATE_COLUMN,
  ],
  normalizeRows: normalizeSessionActionRows,
}
