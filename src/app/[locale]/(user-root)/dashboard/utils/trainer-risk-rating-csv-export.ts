/**
 * Trainer Risk Rating CSV – business report for risk_ratings dashboard tile.
 * Backend returns one risk rating record per trainer with trainer, courses[], and percentages.
 */

import {
  buildCsvString,
  formatCsvDateTime,
  formatText,
  formatYesNo,
  userDisplayName,
} from './csv-export-helpers'

export const TRAINER_RISK_RATING_CSV_HEADERS = [
  'Trainer Name',
  'Trainer Email',
  'Trainer Mobile',
  'Status',
  'High Risk %',
  'Medium Risk %',
  'Low Risk %',
  'Assigned Courses',
  'Course Risk Levels',
  'Active',
  'Created At',
  'Updated At',
] as const

function getTrainer(
  row: Record<string, unknown>,
): Record<string, unknown> | null {
  const trainer = row.trainer
  if (!trainer || typeof trainer !== 'object') return null
  return trainer as Record<string, unknown>
}

function getCourses(row: Record<string, unknown>): Record<string, unknown>[] {
  const courses = row.courses
  if (!Array.isArray(courses)) return []
  return courses.filter(
    (course): course is Record<string, unknown> =>
      course !== null && typeof course === 'object',
  )
}

function formatAssignedCourses(courses: Record<string, unknown>[]): string {
  return courses
    .map((course) => formatText(course.course_name))
    .filter(Boolean)
    .join(', ')
}

function formatCourseRiskLevels(courses: Record<string, unknown>[]): string {
  return courses
    .map((course) => {
      const name = formatText(course.course_name)
      const level = formatText(course.overall_risk_level)
      if (!name || !level) return ''
      return `${name} (${level})`
    })
    .filter(Boolean)
    .join(', ')
}

function rowToCells(row: Record<string, unknown>): string[] {
  const trainer = getTrainer(row)
  const courses = getCourses(row)

  return [
    trainer ? userDisplayName(trainer) : '',
    trainer ? formatText(trainer.email) : '',
    trainer ? formatText(trainer.mobile) : '',
    trainer ? formatText(trainer.status) : '',
    formatText(row.high_percentage),
    formatText(row.medium_percentage),
    formatText(row.low_percentage),
    formatAssignedCourses(courses),
    formatCourseRiskLevels(courses),
    formatYesNo(row.is_active),
    formatCsvDateTime(row.created_at),
    formatCsvDateTime(row.updated_at),
  ]
}

export function buildTrainerRiskRatingCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...TRAINER_RISK_RATING_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
