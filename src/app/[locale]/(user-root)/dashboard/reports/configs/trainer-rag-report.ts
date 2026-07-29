import type { ReportConfig } from '../types'
import { buildTrainerRagReportColumns } from '../columns/trainer-rag-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

/**
 * Trainer RAG rating — fixed risk % + assessment headers, dynamic course columns.
 * Assessment cells match API codes exactly (no ee↔et / ba↔ra / ipl↔apl_rpl aliases).
 */
export const trainerRagReport: ReportConfig = {
  id: 'trainer_rag_report',
  apiType: 'risk_ratings',
  titleKey: 'trainer_rag_report',
  columns: [],
  resolveColumns: buildTrainerRagReportColumns,
  normalizeRows: normalizeIdentityRows,
}
