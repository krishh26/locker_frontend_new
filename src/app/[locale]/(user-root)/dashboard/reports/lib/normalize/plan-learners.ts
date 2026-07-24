/**
 * Expand learner-plan rows into one row per learner, merging plan context
 * onto each learner so common report columns can resolve fields.
 */
export function normalizePlanLearnerRows(
  raw: unknown[],
): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const plan = item as Record<string, unknown>
    const learners = plan.learners

    const planContext: Record<string, unknown> = {
      plan_title: plan.title,
      plan_type: plan.type,
      plan_location: plan.location,
      plan_startDate: plan.startDate,
      plan_Duration: plan.Duration,
      plan_Attended: plan.Attended,
      plan_status: plan.status,
      plan_feedback: plan.feedback,
      assessor_id: plan.assessor_id,
      mentor: plan.assessor_id,
    }

    if (!Array.isArray(learners) || learners.length === 0) {
      output.push({ ...planContext })
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      const learnerRow = learner as Record<string, unknown>
      output.push({
        ...learnerRow,
        ...planContext,
        last_feedback: learnerRow.last_feedback ?? plan.feedback,
        comment: learnerRow.comment ?? plan.feedback,
      })
    }
  }

  return output
}
