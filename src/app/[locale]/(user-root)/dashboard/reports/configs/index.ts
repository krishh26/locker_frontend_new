import type { CardApiType } from '@/store/api/dashboard/types'
import type { ReportConfig } from '../types'
import { activeLearnerReport } from './active-learner'
import { overdueLearnersReport } from './overdue-learners'
import { overdueProgressReviewReport } from './overdue-progress-review'
import { learnersDueComplete30DaysReport } from './learners-due-complete-30-days'
import { learnersOffTrackReport } from './learners-off-track'
import { unmappedEvidenceReport } from './unmapped-evidence'
import { dueActionsReport } from './due-actions'
import { actionsDue7DaysReport } from './actions-due-7-days'
import { overdueActionsReport } from './overdue-actions'
import { otjOffTrackReport } from './otj-off-track'
import { sessionsDueTodayReport } from './sessions-due-today'
import { sessionsDueIn7DaysReport } from './sessions-due-in-7-days'
import { learnersOnSamplingPlanReport } from './learners-on-sampling-plan'
import { learnersNotOnSamplingPlanReport } from './learners-not-on-sampling-plan'
import { trainerRagReport } from './trainer-rag-report'
import { iqaActionsOverdueReport } from './iqa-actions-overdue'
import { allIqaActionsReport } from './all-iqa-actions'
import { iqaActionsDueIn30DaysReport } from './iqa-actions-due-in-30-days'
import { sampleDueInMonthReport } from './sample-due-in-month'
import { samplingPlanOverdueReport } from './sampling-plan-overdue'
import { outstandingEqaActionsReport } from './outstanding-eqa-actions'
import { learnersInGatewayReport } from './learners-in-gateway'

export const DASHBOARD_REPORT_CONFIGS: ReportConfig[] = [
  activeLearnerReport,
  overdueLearnersReport,
  overdueProgressReviewReport,
  learnersDueComplete30DaysReport,
  learnersOffTrackReport,
  unmappedEvidenceReport,
  dueActionsReport,
  actionsDue7DaysReport,
  overdueActionsReport,
  otjOffTrackReport,
  sessionsDueTodayReport,
  sessionsDueIn7DaysReport,
  learnersOnSamplingPlanReport,
  learnersNotOnSamplingPlanReport,
  trainerRagReport,
  iqaActionsOverdueReport,
  allIqaActionsReport,
  iqaActionsDueIn30DaysReport,
  sampleDueInMonthReport,
  samplingPlanOverdueReport,
  outstandingEqaActionsReport,
  learnersInGatewayReport,
]

const byCardId = new Map(
  DASHBOARD_REPORT_CONFIGS.map((config) => [config.id, config]),
)

const byApiType = new Map(
  DASHBOARD_REPORT_CONFIGS.filter(
    (config): config is ReportConfig & { apiType: CardApiType } =>
      Boolean(config.apiType),
  ).map((config) => [config.apiType, config]),
)

export function getReportConfigByCardId(
  cardId: string,
): ReportConfig | undefined {
  return byCardId.get(cardId)
}

export function getReportConfigByApiType(
  apiType: string,
): ReportConfig | undefined {
  return byApiType.get(apiType as CardApiType)
}

export function isSharedReportCard(cardId: string): boolean {
  return byCardId.has(cardId)
}

export function isSharedReportApiType(apiType: string): boolean {
  return byApiType.has(apiType as CardApiType)
}
