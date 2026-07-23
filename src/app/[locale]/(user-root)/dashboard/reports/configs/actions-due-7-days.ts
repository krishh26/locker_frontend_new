import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import {
  ACTION_DUE_DATE_COLUMN,
  ACTION_NAME_COLUMN,
} from '../columns/action-report-columns'
import { normalizeSessionActionRows } from '../lib/normalize/session-actions'

/**
 * Actions due in the next 7 days — common columns + Actions + Action Due Date.
 * Learner set is scoped by apiType `session_action_due_in_next_7_days`.
 */
export const actionsDue7DaysReport: ReportConfig = {
  id: 'actions_due_7_days',
  apiType: 'session_action_due_in_next_7_days',
  titleKey: 'actions_due_7_days',
  columns: [
    ...COMMON_REPORT_COLUMNS,
    ACTION_NAME_COLUMN,
    ACTION_DUE_DATE_COLUMN,
  ],
  normalizeRows: normalizeSessionActionRows,
}
