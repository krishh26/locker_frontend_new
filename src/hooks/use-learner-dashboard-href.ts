"use client"

import { useAppSelector } from "@/store/hooks"
import { selectLearner } from "@/store/slices/authSlice"

/**
 * Back target for learner portfolio pages.
 * - Learners → their own `/dashboard`
 * - Staff with a loaded learner in auth state → that learner's dashboard
 * - Trainers/IQA/EQA without learner context → learner overview
 */
export function useLearnerDashboardHref(): string {
  const role = useAppSelector((state) => state.auth.user?.role)
  const learner = useAppSelector(selectLearner)

  if (role === "Learner") {
    return "/dashboard"
  }

  if (learner?.learner_id != null) {
    return `/learner-dashboard/${learner.learner_id}`
  }

  if (role === "Trainer" || role === "IQA" || role === "EQA") {
    return "/learner-overview"
  }

  if (role === "Employer") {
    return "/learners"
  }

  return "/dashboard"
}
