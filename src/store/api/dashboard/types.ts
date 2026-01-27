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

export type CardData = Record<string, unknown>

