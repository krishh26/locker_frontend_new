/**
 * Expand session-learner-action rows into one row per plan learner,
 * merging action + plan context onto each learner.
 */
export function normalizeSessionActionRows(
  raw: unknown[],
): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const action = item as Record<string, unknown>
    const plan =
      action.learner_plan && typeof action.learner_plan === 'object'
        ? (action.learner_plan as Record<string, unknown>)
        : null
    const learners = plan?.learners

    const actionContext: Record<string, unknown> = {
      action_name: action.action_name,
      action_description: action.action_description,
      target_date: action.target_date,
      job_type: action.job_type,
      learner_status: action.learner_status,
      trainer_status: action.trainer_status,
      who: action.who,
      trainer_feedback: action.trainer_feedback,
      learner_feedback: action.learner_feedback,
      time_spent: action.time_spent,
      comment: action.trainer_feedback ?? action.learner_feedback,
      last_feedback: action.trainer_feedback ?? action.learner_feedback,
      assessor_id: plan?.assessor_id,
      mentor: plan?.assessor_id,
      plan_title: plan?.title,
      plan_type: plan?.type,
    }

    if (!Array.isArray(learners) || learners.length === 0) {
      output.push({ ...actionContext })
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      const learnerRow = learner as Record<string, unknown>
      output.push({
        ...learnerRow,
        ...actionContext,
      })
    }
  }

  return output
}
