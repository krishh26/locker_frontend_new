/**
 * Expand session-learner-action rows into one row per plan learner,
 * merging action + plan context + BE enrichment onto each learner.
 *
 * Enrichment (`enrichReportRowsWithCommonFields`) is on the action root —
 * not on nested `learner_plan.learners` — so copy those keys explicitly.
 */

const ACTION_ENRICHMENT_KEYS = [
  'trainer_name',
  'overall_green',
  'overall_orange',
  'overall_timeline',
  'main_green',
  'main_orange',
  'supplementary_training_status_green',
  'supplementary_training_status_orange',
  'supplementary_training_status',
  'weeks_since_last_review',
  'trainer_comment',
  'last_formal_review',
  'actual_off_the_job_hours_recorded',
  'actual_otj_differential_to_date',
  'actual_off_the_job_percent_achieved',
  'off_the_job_hours_required',
  'off_the_job_hours_required_to_date',
  'last_recorded_otj_entry_date',
  'employer_name',
  'evidence_last_uploaded',
  'last_feedback',
  'fs_english',
  'fs_maths',
  'fSkillsEngStatus',
  'fSkillsMathsStatus',
  'last_visit_type',
  'last_visit_date',
  'next_visit_type',
  'next_visit_date',
  'course_name',
  'course_status',
  'start_date',
  'end_date',
  'status',
  'uln',
  'director_of_curriculum',
  'learner_type',
] as const

function pickActionEnrichment(
  action: Record<string, unknown>,
): Record<string, unknown> {
  const enrichment: Record<string, unknown> = {}
  for (const key of ACTION_ENRICHMENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(action, key)) {
      enrichment[key] = action[key]
    }
  }
  return enrichment
}

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
    const enrichment = pickActionEnrichment(action)

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
      assessor_id: plan?.assessor_id,
      mentor: plan?.assessor_id,
      plan_title: plan?.title,
      plan_type: plan?.type,
    }

    if (!Array.isArray(learners) || learners.length === 0) {
      output.push({
        ...enrichment,
        ...actionContext,
        comment: action.trainer_feedback ?? action.learner_feedback,
        last_feedback:
          enrichment.last_feedback ??
          action.trainer_feedback ??
          action.learner_feedback,
      })
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      const learnerRow = learner as Record<string, unknown>
      output.push({
        ...learnerRow,
        ...enrichment,
        ...actionContext,
        comment:
          action.trainer_feedback ??
          action.learner_feedback ??
          learnerRow.comment,
        last_feedback:
          enrichment.last_feedback ??
          learnerRow.last_feedback ??
          action.trainer_feedback ??
          action.learner_feedback,
      })
    }
  }

  return output
}
