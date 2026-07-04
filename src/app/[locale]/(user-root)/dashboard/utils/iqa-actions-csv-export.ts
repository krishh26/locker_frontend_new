/**
 * IQA actions CSV – business report for iqa action dashboard tiles.
 * Backend returns SamplingPlanAction[] with plan_detail, samplingPlan, learner, and user_id joined.
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatCsvDateTime,
  formatText,
  learnerDisplayName,
  userDisplayName,
} from './csv-export-helpers'

export const IQA_ACTIONS_CSV_HEADERS = [
  'Action Required',
  'Target Date',
  'Status',
  'Assessor Feedback',
  'Learner Name',
  'Learner Email',
  'ULN',
  'Registration Number',
  'Plan Name',
  'Plan Status',
  'Course Name',
  'Course Code',
  'Sample Type',
  'Sampling Status',
  'Planned Date',
  'Action With',
  'Created By',
  'Created At',
  'Updated At',
] as const

function getPlanDetail(row: Record<string, unknown>): Record<string, unknown> | null {
  const detail = row.plan_detail
  if (!detail || typeof detail !== 'object') return null
  return detail as Record<string, unknown>
}

function getLearner(detail: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!detail) return null
  const learner = detail.learner
  if (!learner || typeof learner !== 'object') return null
  return learner as Record<string, unknown>
}

function getSamplingPlan(detail: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!detail) return null
  const plan = detail.samplingPlan ?? detail.sampling_plan
  if (!plan || typeof plan !== 'object') return null
  return plan as Record<string, unknown>
}

function getCourse(plan: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!plan) return null
  const course = plan.course
  if (!course || typeof course !== 'object') return null
  return course as Record<string, unknown>
}

function rowToCells(row: Record<string, unknown>): string[] {
  const detail = getPlanDetail(row)
  const learner = getLearner(detail)
  const samplingPlan = getSamplingPlan(detail)
  const course = getCourse(samplingPlan)

  return [
    formatText(row.action_required),
    formatCsvDateOnly(row.target_date),
    formatText(row.status),
    formatText(row.assessor_feedback),
    learnerDisplayName(learner),
    learner ? formatText(learner.email) : '',
    learner ? formatText(learner.uln) : '',
    learner ? formatText(learner.registration_number) : '',
    samplingPlan ? formatText(samplingPlan.planName ?? samplingPlan.plan_name) : '',
    samplingPlan ? formatText(samplingPlan.status) : '',
    course ? formatText(course.course_name) : '',
    course ? formatText(course.course_code) : '',
    detail ? formatText(detail.sampleType ?? detail.sample_type) : '',
    detail ? formatText(detail.status) : '',
    detail ? formatCsvDateOnly(detail.plannedDate ?? detail.planned_date) : '',
    userDisplayName(row.action_with),
    userDisplayName(row.created_by),
    formatCsvDateTime(row.created_at),
    formatCsvDateTime(row.updated_at),
  ]
}

export function buildIqaActionsCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...IQA_ACTIONS_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
