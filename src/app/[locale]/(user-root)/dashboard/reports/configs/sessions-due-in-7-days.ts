import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizePlanLearnerRows } from '../lib/normalize/plan-learners'

export const sessionsDueIn7DaysReport: ReportConfig = {
  id: 'session_due_in_7_days',
  apiType: 'session_due_in_7_days',
  titleKey: 'session_due_in_7_days',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizePlanLearnerRows,
}
