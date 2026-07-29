import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const learnersDueComplete30DaysReport: ReportConfig = {
  id: 'learners_due_complete_30_days',
  apiType: 'learners_course_due_in_next_30_days',
  titleKey: 'learners_due_complete_30_days',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
