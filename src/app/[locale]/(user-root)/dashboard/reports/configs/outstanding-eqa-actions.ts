import type { ReportConfig } from '../types'
import { EQA_ACTION_REPORT_COLUMNS } from '../columns/iqa-action-report-columns'

/** Stub until backend exposes an apiType for Outstanding EQA Actions. */
export const outstandingEqaActionsReport: ReportConfig = {
  id: 'outstanding_eqa_actions',
  titleKey: 'outstanding_eqa_actions',
  columns: EQA_ACTION_REPORT_COLUMNS,
}
