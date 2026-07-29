import type { ReportConfig } from '../types'
import { GATEWAY_LEARNERS_REPORT_COLUMNS } from '../columns/gateway-learners-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

/** Learners in Gateway — UserCourse rows with course_core_type Gateway. */
export const learnersInGatewayReport: ReportConfig = {
  id: 'learners_in_gateway',
  apiType: 'gateway_learners',
  titleKey: 'learners_in_gateway',
  columns: GATEWAY_LEARNERS_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
