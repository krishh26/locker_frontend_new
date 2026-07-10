/**
 * Learners Off Track CSV – business report for off_track_learners dashboard tile.
 * Backend returns flat learner + course progress rows (one per learner/course).
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatText,
  formatYesNo,
} from './csv-export-helpers'

export const LEARNERS_OFF_TRACK_CSV_HEADERS = [
  'Learner Name',
  'Username',
  'Course Name',
  'Course Code',
  'Course Status',
  'Start Date',
  'End Date',
  'Main Course',
  'Duration %',
  'Days Left',
  'Expected Progress %',
  'Current Progress %',
] as const

function getCourse(row: Record<string, unknown>): Record<string, unknown> | null {
  const course = row.course
  if (!course || typeof course !== 'object') return null
  return course as Record<string, unknown>
}

function learnerDisplayName(row: Record<string, unknown>): string {
  return `${formatText(row.first_name)} ${formatText(row.last_name)}`.trim()
}

function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function rowToCells(row: Record<string, unknown>): string[] {
  const course = getCourse(row)

  return [
    learnerDisplayName(row),
    formatText(row.user_name),
    course ? formatText(course.course_name) : '',
    course ? formatText(course.course_code) : '',
    formatText(row.course_status),
    formatCsvDateOnly(row.start_date),
    formatCsvDateOnly(row.end_date),
    formatYesNo(row.is_main_course),
    formatPercent(row.durationPercent),
    formatPercent(row.daysLeft),
    formatPercent(row.expectedProgressPercent),
    formatPercent(row.currentProgressPercent),
  ]
}

export function buildLearnersOffTrackCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...LEARNERS_OFF_TRACK_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
