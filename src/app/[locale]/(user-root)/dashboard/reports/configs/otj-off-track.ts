import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const otjOffTrackReport: ReportConfig = {
  id: 'otj_up_to_date',
  apiType: 'otj_off_track',
  titleKey: 'otj_up_to_date',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
