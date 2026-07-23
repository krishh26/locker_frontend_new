import type { ReportConfig } from '../types'
import { SAMPLING_PLAN_LEARNER_COLUMNS } from '../columns/sampling-plan-learner-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

/** Learners not on a sampling plan — same columns as “on”; different apiType. */
export const learnersNotOnSamplingPlanReport: ReportConfig = {
  id: 'learner_not_all_sampling_plan',
  apiType: 'learners_over_due',
  titleKey: 'learner_not_all_sampling_plan',
  columns: SAMPLING_PLAN_LEARNER_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
