import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'

/** Stub until backend exposes an apiType for OTJ Off Track. */
export const otjOffTrackReport: ReportConfig = {
  id: 'otj_up_to_date',
  titleKey: 'otj_up_to_date',
  columns: COMMON_REPORT_COLUMNS,
}
