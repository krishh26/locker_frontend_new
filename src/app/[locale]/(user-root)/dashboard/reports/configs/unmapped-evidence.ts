import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

export const unmappedEvidenceReport: ReportConfig = {
  id: 'unmapped_evidences',
  apiType: 'unmapped_evidence',
  titleKey: 'unmapped_evidences',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
