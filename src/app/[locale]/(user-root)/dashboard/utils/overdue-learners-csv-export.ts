/**
 * Overdue learners CSV – business report for learners_over_due tile.
 * Backend returns UserCourse[] with learner_id and user_id joined.
 */

import {
  buildCsvString,
  daysBetween,
  formatCsvDateOnly,
  formatText,
  formatYesNo,
  getCourseFromUserCourse,
  getLearnerFromUserCourse,
  learnerDisplayName,
} from './csv-export-helpers'

export const OVERDUE_LEARNERS_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Mobile',
  'ULN',
  'Registration Number',
  'Job Title',
  'Course Name',
  'Course Code',
  'Course Status',
  'Start Date',
  'End Date',
  'Days Overdue',
  'Predicted Grade',
  'Final Grade',
  'Main Course',
  'BIL Return Date',
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
    learner ? formatText(learner.job_title) : '',
    course ? formatText(course.course_name) : '',
    course ? formatText(course.course_code) : '',
    formatText(row.course_status),
    formatCsvDateOnly(row.start_date),
    formatCsvDateOnly(row.end_date),
    daysBetween(row.end_date),
    formatText(row.predicted_grade),
    formatText(row.final_grade),
    formatYesNo(row.is_main_course),
    formatCsvDateOnly(row.bil_return_date),
  ]
}

export function buildOverdueLearnersCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...OVERDUE_LEARNERS_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
