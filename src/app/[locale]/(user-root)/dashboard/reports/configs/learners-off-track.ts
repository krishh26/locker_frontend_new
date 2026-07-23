import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const learnersOffTrackReport: ReportConfig = {
  id: 'learners_off_track',
  apiType: 'off_track_learners',
  titleKey: 'learners_off_track',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
