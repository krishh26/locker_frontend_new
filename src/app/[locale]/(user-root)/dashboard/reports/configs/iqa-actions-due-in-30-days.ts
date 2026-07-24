import type { ReportConfig } from '../types'
import { IQA_ACTION_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const iqaActionsDueIn30DaysReport: ReportConfig = {
  id: 'iqa_actions_due_in_30_days',
  apiType: 'iqa_actions_due_in_30_days',
  titleKey: 'iqa_actions_due_in_30_days',
  columns: IQA_ACTION_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
