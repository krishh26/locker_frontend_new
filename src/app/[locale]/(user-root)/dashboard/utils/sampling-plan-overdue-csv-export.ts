/** Sampling Plan Overdue CSV – business report for sampling_plan_overdue dashboard tile. */

export const SAMPLING_PLAN_OVERDUE_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Mobile',
  'ULN',
  'Registration Number',
  'Job Title',
  'Funding Body',
  'Sample Type',
  'Sampling Status',
  'Planned Date',
  'Completed Date',
  'Outcome',
  'Feedback',
  'Plan Name',
  'Plan Status',
  'Total Learners',
  'Total Sampled',
  'Assessment Methods',
  'Sampled Units',
  'Assessor Decision Correct',
  'IQA Conclusion',
] as const

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function formatCsvDateOnly(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function formatAssessorDecision(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return formatText(value)
}

function getLearner(row: Record<string, unknown>): Record<string, unknown> | null {
  const learner = row.learner
  if (!learner || typeof learner !== 'object') return null
  return learner as Record<string, unknown>
}

function getSamplingPlan(row: Record<string, unknown>): Record<string, unknown> | null {
  const plan = row.samplingPlan ?? row.sampling_plan
  if (!plan || typeof plan !== 'object') return null
  return plan as Record<string, unknown>
}

function learnerDisplayName(learner: Record<string, unknown> | null): string {
  if (!learner) return ''
  return `${formatText(learner.first_name)} ${formatText(learner.last_name)}`.trim()
}

function formatTrueObjectKeys(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  return Object.entries(value as Record<string, unknown>)
    .filter(([, flag]) => flag === true)
    .map(([key]) => key)
    .join(', ')
}

function formatSampledUnits(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((unit) => {
      if (!unit || typeof unit !== 'object') return ''
      const entry = unit as Record<string, unknown>
      return formatText(entry.unit_code ?? entry.unit_ref ?? entry.code)
    })
    .filter(Boolean)
    .join(', ')
}

function rowToCells(row: Record<string, unknown>): string[] {
  const learner = getLearner(row)
  const samplingPlan = getSamplingPlan(row)
  const assessmentMethods =
    row.assessment_methods ?? row.assessmentMethods

  return [
    learnerDisplayName(learner),
    learner ? formatText(learner.email) : '',
    learner ? formatText(learner.mobile) : '',
    learner ? formatText(learner.uln) : '',
    learner ? formatText(learner.registration_number) : '',
    learner ? formatText(learner.job_title) : '',
    learner ? formatText(learner.funding_body) : '',
    formatText(row.sampleType ?? row.sample_type),
    formatText(row.status),
    formatCsvDateOnly(row.plannedDate ?? row.planned_date),
    formatCsvDateOnly(row.completedDate ?? row.completed_date),
    formatText(row.outcome),
    formatText(row.feedback),
    samplingPlan ? formatText(samplingPlan.planName ?? samplingPlan.plan_name) : '',
    samplingPlan ? formatText(samplingPlan.status) : '',
    samplingPlan ? formatText(samplingPlan.totalLearners ?? samplingPlan.total_learners) : '',
    samplingPlan ? formatText(samplingPlan.totalSampled ?? samplingPlan.total_sampled) : '',
    formatTrueObjectKeys(assessmentMethods),
    formatSampledUnits(row.sampledUnits ?? row.sampled_units),
    formatAssessorDecision(row.assessor_decision_correct),
    formatTrueObjectKeys(row.iqa_conclusion),
  ]
}

export function buildSamplingPlanOverdueCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...SAMPLING_PLAN_OVERDUE_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))

  return [headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
