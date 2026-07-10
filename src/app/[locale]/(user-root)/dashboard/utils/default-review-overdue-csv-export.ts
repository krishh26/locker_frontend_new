/** Default Review Overdue CSV – business report for default_review_overdue dashboard tile. */

import {
  escapeCsvCell,
  formatCsvDateOnly,
  formatCsvDateTime,
  formatText,
  formatYesNo,
} from './csv-export-helpers'

export const DEFAULT_REVIEW_OVERDUE_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Mobile',
  'ULN',
  'Registration Number',
  'Funding Body',
  'Job Title',
  'Course Name',
  'Course Code',
  'Course Level',
  'Course Type',
  'Course Status',
  'Course Start Date',
  'Course End Date',
  'Predicted Grade',
  'Final Grade',
  'Course Awarding Body',
  'Planned Review Date',
  'Review Date',
  'Last Login',
  'Main Course',
  'BIL Return Date',
] as const

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
    learner ? formatText(learner.job_title) : '',
    course ? formatText(course.course_name) : '',
    course ? formatText(course.course_code) : '',
    course ? formatText(course.level) : '',
    course ? formatText(course.course_type) : '',
    formatText(row.course_status),
    formatCsvDateOnly(row.start_date),
    formatCsvDateOnly(row.end_date),
    formatText(row.predicted_grade),
    formatText(row.final_grade),
    course ? formatText(course.awarding_body) : '',
    learner ? formatCsvDateOnly(learner.planned_review_date) : '',
    learner ? formatCsvDateOnly(learner.review_date) : '',
    learner ? formatCsvDateTime(learner.last_login) : '',
    formatYesNo(row.is_main_course),
    formatCsvDateOnly(row.bil_return_date),
  ]
}

export function buildDefaultReviewOverdueCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...DEFAULT_REVIEW_OVERDUE_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))

  return [headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
