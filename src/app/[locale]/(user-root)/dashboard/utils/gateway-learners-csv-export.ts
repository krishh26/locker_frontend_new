/**
 * Gateway learners CSV – business report for gateway_learners dashboard tile.
 * Backend returns UserCourse[] with learner_id and course joined.
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatText,
  formatYesNo,
  getCourseFromUserCourse,
  getLearnerFromUserCourse,
  learnerDisplayName,
} from './csv-export-helpers'

export const GATEWAY_LEARNERS_CSV_HEADERS = [
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
  'Course Level',
  'Course Type',
  'Course Status',
  'Start Date',
  'End Date',
  'Predicted Grade',
  'Final Grade',
  'Course Awarding Body',
  'BIL Return Date',
  'Main Course',
] as const

function rowToCells(row: Record<string, unknown>): string[] {
  const learner = getLearnerFromUserCourse(row)
  const course = getCourseFromUserCourse(row)

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
    course ? formatText(course.level) : '',
    course ? formatText(course.course_type) : '',
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

export function buildGatewayLearnersCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...GATEWAY_LEARNERS_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
