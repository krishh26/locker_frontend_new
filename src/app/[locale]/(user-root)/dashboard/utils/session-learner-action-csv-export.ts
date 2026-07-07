/**
 * Session learner action CSV – business report for session action dashboard tiles.
 * Backend returns SessionLearnerAction[] with learner_plan and learners joined.
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatCsvDateTime,
  formatText,
  formatYesNo,
  learnerDisplayName,
} from './csv-export-helpers'

export const SESSION_LEARNER_ACTION_CSV_HEADERS = [
  'Action Name',
  'Action Description',
  'Target Date',
  'Job Type',
  'Learner Status',
  'Trainer Status',
  'Who',
  'Learner Name',
  'Learner Email',
  'Plan Title',
  'Plan Type',
  'Plan Start Date',
  'Trainer Name',
  'Trainer Feedback',
  'Learner Feedback',
  'Time Spent (minutes)',
  'Active',
  'Created At',
  'Updated At',
] as const

function getLearnerPlan(row: Record<string, unknown>): Record<string, unknown> | null {
  const plan = row.learner_plan
  if (!plan || typeof plan !== 'object') return null
  return plan as Record<string, unknown>
}

function actionRowToCells(
  row: Record<string, unknown>,
  plan: Record<string, unknown> | null,
  learner: Record<string, unknown> | null,
): string[] {
  return [
    formatText(row.action_name),
    formatText(row.action_description),
    formatCsvDateOnly(row.target_date),
    formatText(row.job_type),
    formatText(row.learner_status),
    formatText(row.trainer_status),
    formatText(row.who),
    learnerDisplayName(learner),
    learner ? formatText(learner.email) : '',
    plan ? formatText(plan.title) : '',
    plan ? formatText(plan.type) : '',
    plan ? formatCsvDateTime(plan.startDate) : '',
    '',
    formatText(row.trainer_feedback),
    formatText(row.learner_feedback),
    formatText(row.time_spent),
    formatYesNo(row.status),
    formatCsvDateTime(row.created_at),
    formatCsvDateTime(row.updated_at),
  ]
}

function expandActionsToRows(rows: Record<string, unknown>[]): string[][] {
  const output: string[][] = []

  for (const row of rows) {
    const plan = getLearnerPlan(row)
    const learners = plan?.learners

    if (!Array.isArray(learners) || learners.length === 0) {
      output.push(actionRowToCells(row, plan, null))
      continue
    }

    for (const learner of learners) {
      if (!learner || typeof learner !== 'object') continue
      output.push(actionRowToCells(row, plan, learner as Record<string, unknown>))
    }
  }

  return output
}

export function buildSessionLearnerActionCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...SESSION_LEARNER_ACTION_CSV_HEADERS]
  const dataRows = expandActionsToRows(rows)
  return buildCsvString([headerRow, ...dataRows])
}
