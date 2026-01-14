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

