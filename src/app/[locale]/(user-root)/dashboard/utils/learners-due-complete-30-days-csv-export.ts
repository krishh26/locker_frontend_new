/** Learners due to complete within 30 days – business report for learners_course_due_in_next_30_days tile. */

export const LEARNERS_DUE_COMPLETE_30_DAYS_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Mobile',
  'ULN',
  'Registration Number',
  'Funding Body',
  'Awarding Body',
  'Job Title',
  'Course Name',
  'Course Code',
  'Course Type',
  'Course Level',
  'Course Status',
  'Start Date',
  'End Date',
  'Predicted Grade',
  'Final Grade',
  'Awarding Body (Course)',
  'BIL Return Date',
  'Main Course',
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

function formatYesNo(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return formatText(value)
}

function getLearner(row: Record<string, unknown>): Record<string, unknown> | null {
  const learner = row.learner_id
  if (!learner || typeof learner !== 'object') return null
  return learner as Record<string, unknown>
}

function getCourse(row: Record<string, unknown>): Record<string, unknown> | null {
  const course = row.course
  if (!course || typeof course !== 'object') return null
  return course as Record<string, unknown>
}

function learnerDisplayName(learner: Record<string, unknown> | null): string {
  if (!learner) return ''
  return `${formatText(learner.first_name)} ${formatText(learner.last_name)}`.trim()
}

function rowToCells(row: Record<string, unknown>): string[] {
  const learner = getLearner(row)
  const course = getCourse(row)

  return [
    learnerDisplayName(learner),
    learner ? formatText(learner.email) : '',
    learner ? formatText(learner.mobile) : '',
    learner ? formatText(learner.uln) : '',
    learner ? formatText(learner.registration_number) : '',
    learner ? formatText(learner.funding_body) : '',
    learner ? formatText(learner.awarding_body) : '',
    learner ? formatText(learner.job_title) : '',
    course ? formatText(course.course_name) : '',
    course ? formatText(course.course_code) : '',
    course ? formatText(course.course_type) : '',
    course ? formatText(course.level) : '',
    formatText(row.course_status),
    formatCsvDateOnly(row.start_date),
    formatCsvDateOnly(row.end_date),
    formatText(row.predicted_grade),
    formatText(row.final_grade),
    course ? formatText(course.awarding_body) : '',
    formatCsvDateOnly(row.bil_return_date),
    formatYesNo(row.is_main_course),
  ]
}

export function buildLearnersDueComplete30DaysCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...LEARNERS_DUE_COMPLETE_30_DAYS_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))

  return [headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
