import type { ReportConfig } from '../types'
import { SAMPLING_PLAN_LEARNER_COLUMNS } from '../columns/sampling-plan-learner-columns'
import { normalizeIdentityRows } from '../lib/normalize/identity'

/** Learners on a sampling plan — same columns as “not on”; different apiType. */
export const learnersOnSamplingPlanReport: ReportConfig = {
  id: 'learner_all_sampling_plan',
  apiType: 'learner_plan_due',
  titleKey: 'learner_all_sampling_plan',
  columns: SAMPLING_PLAN_LEARNER_COLUMNS,
  normalizeRows: normalizeIdentityRows,
}
