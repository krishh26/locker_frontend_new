/** Shared helpers for dashboard CSV business reports. */

export function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function formatCsvDateOnly(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatCsvDateTime(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const date = value instanceof Date ? value : new Date(String(value))
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
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
