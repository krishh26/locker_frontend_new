/**
 * Learners on BIL CSV – business report for suspended_learners dashboard tile.
 * Backend returns UserCourse[] with learner_id, course, and trainer_id joined.
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatText,
  getCourseFromUserCourse,
  getLearnerFromUserCourse,
  learnerDisplayName,
  userDisplayName,
} from './csv-export-helpers'

export const LEARNERS_ON_BIL_CSV_HEADERS = [
  'Learner Name',
  'Course',
  'Trainer Name',
  'Suspended Date (Locker Date)',
  'Suspended Until Date',
] as const

function resolveLearnerName(row: Record<string, unknown>): string {
  const learner = getLearnerFromUserCourse(row)
  if (learner) {
    const name = learnerDisplayName(learner)
    if (name) return name
    const flatName = formatText(learner.name)
    if (flatName) return flatName
  }

  return formatText(row.learner_name)
}

function resolveCourseName(row: Record<string, unknown>): string {
  const course = getCourseFromUserCourse(row)
  if (!course) return ''

  return formatText(course.course_name) || formatText(course.name)
}

function resolveTrainerName(row: Record<string, unknown>): string {
  const flatName = formatText(row.trainer_name)
  if (flatName) return flatName

  return userDisplayName(row.trainer_id)
}

function resolveSuspendedDate(row: Record<string, unknown>): string {
  return formatCsvDateOnly(row.updated_at)
}

function rowToCells(row: Record<string, unknown>): string[] {
  return [
    resolveLearnerName(row),
    resolveCourseName(row),
    resolveTrainerName(row),
    resolveSuspendedDate(row),
    formatCsvDateOnly(row.bil_return_date),
  ]
}

export function buildLearnersOnBilCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...LEARNERS_ON_BIL_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
