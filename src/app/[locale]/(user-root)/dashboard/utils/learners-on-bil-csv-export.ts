/** Learners on BIL CSV – column order and labels per report specification. */

export const LEARNERS_ON_BIL_CSV_HEADERS = [
  'Learner Name',
  'Course',
  'Trainer Name',
  'Suspended Date (Locker Date)',
  'Suspended Until Date',
] as const

/** Known suspended/locker date fields on the API payload (if present). */
const SUSPENDED_DATE_FIELDS = [
  'suspended_date',
  'locker_date',
  'bil_suspended_date',
  'suspension_date',
  'suspended_at',
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

function learnerDisplayName(learner: unknown): string {
  if (!learner || typeof learner !== 'object') return ''
  const l = learner as {
    first_name?: string | null
    last_name?: string | null
  }
  return `${l.first_name ?? ''} ${l.last_name ?? ''}`.trim()
}

function courseDisplayName(course: unknown): string {
  if (!course || typeof course !== 'object') return ''
  return String((course as { course_name?: string }).course_name ?? '')
}

function trainerDisplayName(trainer: unknown): string {
  if (!trainer || typeof trainer !== 'object') return ''
  const t = trainer as {
    first_name?: string | null
    last_name?: string | null
    user_name?: string | null
  }
  const full = `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()
  return full || String(t.user_name ?? '')
}

function resolveSuspendedDate(row: Record<string, unknown>): string {
  for (const field of SUSPENDED_DATE_FIELDS) {
    const value = row[field]
    if (value !== null && value !== undefined && value !== '') {
      return formatCsvDateOnly(value)
    }
  }
  return ''
}

function rowToCells(row: Record<string, unknown>): string[] {
  return [
    learnerDisplayName(row.learner_id),
    courseDisplayName(row.course),
    trainerDisplayName(row.trainer_id),
    resolveSuspendedDate(row),
    formatCsvDateOnly(row.bil_return_date),
  ]
}

export function buildLearnersOnBilCsv(rows: Record<string, unknown>[]): string {
  const headerRow = [...LEARNERS_ON_BIL_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))

  return [headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
