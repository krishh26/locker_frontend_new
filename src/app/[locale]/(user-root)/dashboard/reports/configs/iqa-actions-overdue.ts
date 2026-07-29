import type { ReportConfig } from '../types'
import { IQA_ACTION_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const iqaActionsOverdueReport: ReportConfig = {
  id: 'iqa_actions_overdue',
  apiType: 'iqa_actions_overdue',
  titleKey: 'iqa_actions_overdue',
  columns: IQA_ACTION_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
