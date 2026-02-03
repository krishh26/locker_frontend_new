// Valid API types for card data queries (used in query parameters)
export type CardApiType =
  | "active_learners"
  | "suspended_learners"
  | "assignments_without_mapped"
  | "learners_over_due"
  | "learner_plan_due"
  | "learner_plan_due_in_next_7_days"
  | "session_learner_action_due"
  | "session_action_due_in_next_7_days"
  | "session_learner_action_overdue"
  | "learners_course_due_in_next_30_days"

// Mapping from CardApiType (query param) to DashboardCounts key (API response)
export const cardApiTypeToCountKey: Record<CardApiType, keyof DashboardCounts> = {
  active_learners: "active_learners_count",
  suspended_learners: "learners_suspended_count",
  assignments_without_mapped: "assignmentsWithoutMapped_count",
  learners_over_due: "learnersOverDue_count",
  learner_plan_due: "learnerPlanDue_count",
  learner_plan_due_in_next_7_days: "learnerPlanDueInNext7Days_count",
  session_learner_action_due: "sessionLearnerActionDue_count",
  session_action_due_in_next_7_days: "sessionLearnerActionDueInNext7Days_count",
  session_learner_action_overdue: "sessionLearnerActionOverdue_count",
  learners_course_due_in_next_30_days: "learnersCourseDueInNext30Days_count",
}

export interface DashboardCounts {
  active_learners_count: number
  learners_suspended_count: number
  assignmentsWithoutMapped_count: number
  learnersOverDue_count: number
  learnerPlanDue_count: number
  learnerPlanDueInNext7Days_count: number
  sessionLearnerActionDue_count: number
  sessionLearnerActionDueInNext7Days_count: number
  sessionLearnerActionOverdue_count: number
  learnersCourseDueInNext30Days_count: number
  totalCourses: number
  [key: string]: number
}

export interface DashboardResponse {
  message: string
  status: boolean
  data: DashboardCounts
}

export interface CardDataResponse {
  message?: string
  status: boolean
  data?: unknown[]
  learners?: unknown[]
  list?: unknown[]
  error?: string
}

/**
 * Active learners report – extended metrics (FE ready; BE to implement).
 * When GET /learner/list-with-count?type=active_learners returns summary,
 * the Active Learner card detail modal and CSV export will show these fields.
 *
 * BE TODO: Add to active_learners response (e.g. under `summary` or top level):
 * - sa_unmapped_evidence_count, outstanding_iqa_actions_count
 * - orange_percent_last_month, orange_percent_current_month
 * - green_percent_last_month, green_percent_current_month
 */
export interface ActiveLearnersSummary {
  sa_unmapped_evidence_count?: number
  outstanding_iqa_actions_count?: number
  orange_percent_last_month?: number
  orange_percent_current_month?: number
  green_percent_last_month?: number
  green_percent_current_month?: number
}

export interface ActiveLearnersCardDataResponse extends CardDataResponse {
  summary?: ActiveLearnersSummary
}

export type CardData = Record<string, unknown>

// New types based on CSV: Dashboard Module (6 APIs)
// Backend returns totalSubscriptions, activeOrganisations, activeSubscriptions (no totalRevenue)
export interface SystemSummary {
  totalOrganisations: number
  totalCentres: number
  totalUsers: number
  totalAccountManagers?: number
  activeSubscriptions: number
  totalRevenue?: number
  /** Backend system-summary response */
  totalSubscriptions?: number
  activeOrganisations?: number
}

export interface SystemSummaryResponse {
  status: boolean
  message?: string
  data: SystemSummary
}

export interface OrganisationMetrics {
  total: number
  active: number
  suspended: number
  byStatus: Record<string, number>
}

export interface OrganisationMetricsResponse {
  status: boolean
  message?: string
  data: OrganisationMetrics
}

export interface UserMetrics {
  total: number
  byRole: {
    MasterAdmin: number
    AccountManager: number
    Learner: number
    [key: string]: number
  }
}

export interface UserMetricsResponse {
  status: boolean
  message?: string
  data: UserMetrics
}

export interface AccountManagerMetrics {
  total: number
  active: number
  totalAssignedOrganisations: number
  averageOrganisationsPerManager: number
}

export interface AccountManagerMetricsResponse {
  status: boolean
  message?: string
  data: AccountManagerMetrics
}

export interface ActivityMetrics {
  recentActions: number
  actionsLast24Hours: number
  actionsLast7Days: number
  actionsLast30Days: number
  topActions: Array<{
    action: string
    count: number
  }>
}

export interface ActivityMetricsResponse {
  status: boolean
  message?: string
  data: ActivityMetrics
}

export interface StatusOverview {
  organisations: {
    active: number
    suspended: number
  }
  centres: {
    active: number
    suspended: number
  }
  users: {
    active: number
    inactive: number
  }
  subscriptions: {
    active: number
    expired: number
  }
}

export interface StatusOverviewResponse {
  status: boolean
  message?: string
  data: StatusOverview
}

/** Portfolio card count data (learner/course overview) */
export interface PortfolioCountData {
  evidenceTotal?: number
  unitsTotal?: number
  unitsCompleted?: number
  progressPercentage?: number
  gapsTotal?: number
  availableUnits?: number
  selectedUnits?: number
  sessionsTotal?: number
  resourcesTotal?: number
  newDocTotal?: number
}
