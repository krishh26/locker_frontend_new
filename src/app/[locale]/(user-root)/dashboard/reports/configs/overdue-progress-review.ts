import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizePlanLearnerRows } from '../lib/normalize/plan-learners'

export const overdueProgressReviewReport: ReportConfig = {
  id: 'overdue_progress_review',
  apiType: 'learner_plan_due',
  titleKey: 'overdue_progress_review',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizePlanLearnerRows,
}
