import type { ReportConfig } from '../types'
import { SAMPLING_DUE_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const samplingPlanOverdueReport: ReportConfig = {
  id: 'sampling_plan_overdue',
  apiType: 'sampling_plan_overdue',
  titleKey: 'sampling_plan_overdue',
  columns: SAMPLING_DUE_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
