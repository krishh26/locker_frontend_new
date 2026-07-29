import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizePlanLearnerRows } from '../lib/normalize/plan-learners'

export const sessionsDueTodayReport: ReportConfig = {
  id: 'session_due_today',
  apiType: 'session_due_today',
  titleKey: 'session_due_today',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizePlanLearnerRows,
}
