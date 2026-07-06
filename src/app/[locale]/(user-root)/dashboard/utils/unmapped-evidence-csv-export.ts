/**
 * Unmapped evidence – business report for unmapped_evidence dashboard tile.
 * One CSV row per evidence record from GET /learner/list-with-count?type=unmapped_evidence.
 */

import {
  buildCsvString,
  formatCsvDateTime,
  formatText,
  formatYesNo,
} from './csv-export-helpers'

export const UNMAPPED_EVIDENCE_CSV_HEADERS = [
  'Learner Name',
  'Course Name',
  'Course Code',
  'File Type',
  'File Name',
  'File Description',
  'Uploaded At',
  'Trainer Name',
  'Employer Name',
  'Learner Signature Status',
  'Learner Signed At',
  'Learner Signature Requested At',
  'Learner Signature Requested By',
  'Trainer Signature Status',
  'Trainer Signed At',
  'Trainer Signature Requested At',
  'Trainer Signature Requested By',
  'Employer Signature Status',
  'Employer Signed At',
  'IQA Signature Status',
  'IQA Signed At',
] as const

type SignatureRole = 'Learner' | 'Trainer' | 'Employer' | 'IQA'

function getNestedObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function getSignature(
  row: Record<string, unknown>,
  role: SignatureRole,
): Record<string, unknown> | null {
  const signatures = getNestedObject(row.signatures)
  if (!signatures) return null
  return getNestedObject(signatures[role])
}

function signatureCells(
  row: Record<string, unknown>,
  role: SignatureRole,
  includeRequestedFields: boolean,
): string[] {
  const signature = getSignature(row, role)
  if (!signature) {
    return Array(includeRequestedFields ? 4 : 2).fill('')
  }

  const cells = [
    formatYesNo(signature.isSigned),
    formatCsvDateTime(signature.signedAt),
  ]

  if (includeRequestedFields) {
    cells.push(
      formatCsvDateTime(signature.requestedAt),
      formatText(signature.requestedBy),
    )
  }

  return cells
}

function rowToCells(row: Record<string, unknown>): string[] {
  const learner = getNestedObject(row.learner)
  const course = getNestedObject(row.course)

  return [
    learner ? formatText(learner.name) : '',
    course ? formatText(course.name) : '',
    course ? formatText(course.code) : '',
    formatText(row.file_type),
    formatText(row.file_name),
    formatText(row.file_description),
    formatCsvDateTime(row.uploaded_at),
    formatText(row.trainer_name),
    formatText(row.employer_name),
    ...signatureCells(row, 'Learner', true),
    ...signatureCells(row, 'Trainer', true),
    ...signatureCells(row, 'Employer', false),
    ...signatureCells(row, 'IQA', false),
  ]
}

export function buildUnmappedEvidenceCsv(
  rows: Record<string, unknown>[],
): string {
  const headerRow = [...UNMAPPED_EVIDENCE_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))
  return buildCsvString([headerRow, ...dataRows])
}
