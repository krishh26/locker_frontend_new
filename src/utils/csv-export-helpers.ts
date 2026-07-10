/** Shared helpers for CSV exports across the application. */

export function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toValidDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return null
  return date
}

/** UK date format for CSV exports: DD/MM/YYYY */
export function formatCsvDateOnly(value: unknown): string {
  const date = toValidDate(value)
  if (!date) return ''
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** UK date-time format for CSV exports: DD/MM/YYYY HH:mm:ss (24-hour) */
export function formatCsvDateTime(value: unknown): string {
  const date = toValidDate(value)
  if (!date) return ''
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function formatText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

export function formatYesNo(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return formatText(value)
}

export function userDisplayName(user: unknown): string {
  if (!user || typeof user !== 'object') return ''
  const u = user as {
    first_name?: string | null
    last_name?: string | null
    user_name?: string | null
  }
  const full = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
  return full || formatText(u.user_name)
}

export function learnerDisplayName(learner: unknown): string {
  if (!learner || typeof learner !== 'object') return ''
  const l = learner as {
    first_name?: string | null
    last_name?: string | null
  }
  return `${l.first_name ?? ''} ${l.last_name ?? ''}`.trim()
}

export function getLearnerFromUserCourse(
  row: Record<string, unknown>,
): Record<string, unknown> | null {
  const learner = row.learner_id
  if (!learner || typeof learner !== 'object') return null
  return learner as Record<string, unknown>
}

export function getCourseFromUserCourse(
  row: Record<string, unknown>,
): Record<string, unknown> | null {
  const course = row.course
  if (!course || typeof course !== 'object') return null
  return course as Record<string, unknown>
}

export function buildCsvString(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n')
}

export function daysBetween(endDate: unknown, fromDate = new Date()): string {
  if (endDate === null || endDate === undefined || endDate === '') return ''
  const end = endDate instanceof Date ? endDate : new Date(String(endDate))
  if (isNaN(end.getTime())) return ''
  const diffMs = fromDate.getTime() - end.getTime()
  if (diffMs <= 0) return '0'
  return String(Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
