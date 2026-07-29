/**
 * Expand learner-plan rows into one row per learner, merging plan context
 * onto each learner so common report columns can resolve fields.
 *
 * BE enrichment (`enrichReportRowsWithCommonFields`) is attached to the plan
 * root — copy those keys onto each expanded learner row.
 */

const PLAN_ENRICHMENT_KEYS = [
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

function pickPlanEnrichment(
  plan: Record<string, unknown>,
): Record<string, unknown> {
  const enrichment: Record<string, unknown> = {}
  for (const key of PLAN_ENRICHMENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(plan, key)) {
      enrichment[key] = plan[key]
    }
  }
  return enrichment
}

export function normalizePlanLearnerRows(
  raw: unknown[],
): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const plan = item as Record<string, unknown>
    const learners = plan.learners
    const planEnrichment = pickPlanEnrichment(plan)

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
      output.push({ ...planEnrichment, ...planContext })
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      const learnerRow = learner as Record<string, unknown>
      output.push({
        ...learnerRow,
        ...planEnrichment,
        ...planContext,
        // Prefer enrichment datetime over plan session feedback text
        last_feedback:
          planEnrichment.last_feedback ??
          learnerRow.last_feedback ??
          plan.feedback,
        comment: learnerRow.comment ?? plan.feedback,
      })
    }
  }

  return output
}
