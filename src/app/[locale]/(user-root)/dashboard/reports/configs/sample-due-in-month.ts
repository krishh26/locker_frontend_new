import type { ReportConfig } from '../types'
import { SAMPLING_DUE_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const sampleDueInMonthReport: ReportConfig = {
  id: 'sample_due_in_month',
  apiType: 'sample_due_in_month',
  titleKey: 'sample_due_in_month',
  columns: SAMPLING_DUE_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
