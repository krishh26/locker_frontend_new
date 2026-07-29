import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const overdueLearnersReport: ReportConfig = {
  id: 'overdue_learners',
  apiType: 'learners_over_due',
  titleKey: 'overdue_learners',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
