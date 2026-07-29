import type { ReportConfig } from '../types'
import { COMMON_REPORT_COLUMNS } from '../columns/common-report-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

/**
 * Active Learner report — uses all common columns.
 * Field mapping is driven by `COMMON_REPORT_COLUMNS` against
 * GET /learner/list-with-count?type=active_learners.
 *
 * Populated from API when present: identity, employer, status, ULN,
 * director_of_curriculum, evidence/feedback timestamps, progress fields,
 * user_course / registration dates, FS Eng/Maths, visits, comment,
 * learner_type, review_date, otj_details (+ expected hours / weekly hours).
 *
 * Empty until backend provides data or nested user_course is joined:
 * assessor/trainer when mentor/iqas/user_course.trainer missing,
 * supplementary training columns, OTJ required/% when hours/dates absent.
 */
export const activeLearnerReport: ReportConfig = {
  id: 'active_learner',
  apiType: 'active_learners',
  titleKey: 'active_learner',
  columns: COMMON_REPORT_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
