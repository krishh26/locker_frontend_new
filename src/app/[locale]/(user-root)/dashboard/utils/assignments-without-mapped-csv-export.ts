/**
 * Assignments without mapped evidence – business report for assignments_without_mapped tile.
 * Backend returns Assignment[] with user (learner) joined.
 */

import {
  buildCsvString,
  formatCsvDateTime,
  formatText,
  userDisplayName,
} from './csv-export-helpers'

export const ASSIGNMENTS_WITHOUT_MAPPED_CSV_HEADERS = [
  'Learner Name',
  'Email',
  'Assignment Title',
  'Description',
  'File Name',
  'Assessment Status',
  'Grade',
  'Assessment Methods',
  'Created At',
  'Updated At',
  'Trainer Feedback',
] as const

function getLearnerUser(row: Record<string, unknown>): Record<string, unknown> | null {
  const user = row.user
  if (!user || typeof user !== 'object') return null
  return user as Record<string, unknown>
}

function getFileName(row: Record<string, unknown>): string {
  const file = row.file
  if (!file || typeof file !== 'object') return ''
  return formatText((file as { name?: string }).name)
}

function formatAssessmentMethods(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value.map((v) => formatText(v)).filter(Boolean).join(', ')
}

function rowToCells(row: Record<string, unknown>): string[] {
  const user = getLearnerUser(row)

  return [
    userDisplayName(user),
    user ? formatText(user.email) : '',
    formatText(row.title),
    formatText(row.description),
    getFileName(row),
    formatText(row.status),
    formatText(row.grade),
    formatAssessmentMethods(row.assessment_method),
    formatCsvDateTime(row.created_at),
    formatCsvDateTime(row.updated_at),
    formatText(row.trainer_feedback),
  ]
}

export function buildAssignmentsWithoutMappedCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...ASSIGNMENTS_WITHOUT_MAPPED_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
