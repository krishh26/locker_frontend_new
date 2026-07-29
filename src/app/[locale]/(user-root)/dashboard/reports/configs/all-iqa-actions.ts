import type { ReportConfig } from '../types'
import { IQA_ACTION_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const allIqaActionsReport: ReportConfig = {
  id: 'all_iqa_actions',
  apiType: 'all_iqa_actions',
  titleKey: 'all_iqa_actions',
  columns: IQA_ACTION_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
