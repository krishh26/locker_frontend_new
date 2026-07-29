import {
  formatCsvDateOnly,
  formatCsvDateTime,
} from '@/utils/csv-export-helpers'
import type { ReportCellFormat, ReportColumnDef } from '../types'

/* ============================================================
   NESTED VALUE ACCESS
============================================================ */

export function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return undefined

  const tokens = path.match(/[^.[\]]+|\[\d+\]/g) ?? []
  let current: unknown = obj

  for (const token of tokens) {
    if (current == null) return undefined

    if (token.startsWith('[')) {
      const index = Number(token.slice(1, -1))
      current = Array.isArray(current) ? current[index] : undefined
    } else {
      current = (current as Record<string, unknown>)[token]
    }
  }

  return current
}

/** Returns the first non-empty value from dot/bracket paths on the row. */
export function resolveFromPaths(
  row: Record<string, unknown>,
  paths: string[],
): unknown {
  for (const path of paths) {
    const value = getNestedValue(row, path)
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value
    }
  }
  return undefined
}

export function parsePercentage(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    return Number(value.replace('%', '').trim()) || 0
  }
  return 0
}

function isIsoDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value)
}

const EMPTY_CELL_VALUE = 'N/A'

export function formatReportCellValue(
  value: unknown,
  format: ReportCellFormat = 'text',
): string {
  if (value === null || value === undefined) return EMPTY_CELL_VALUE
  if (typeof value === 'string' && value.trim() === '') return EMPTY_CELL_VALUE

  let formatted: string

  if (format === 'datetime') {
    formatted = formatCsvDateTime(value)
  } else if (format === 'date') {
    formatted = formatCsvDateOnly(value)
  } else if (format === 'number') {
    if (typeof value === 'number') {
      formatted = Number.isNaN(value) ? '' : Number(value.toFixed(2)).toString()
    } else {
      const n = Number(value)
      formatted = Number.isNaN(n) ? String(value) : Number(n.toFixed(2)).toString()
    }
  } else if (format === 'percent') {
    if (value === '') {
      formatted = ''
    } else if (typeof value === 'string' && value.includes('%')) {
      formatted = String(Math.round(parsePercentage(value)))
    } else if (typeof value === 'number') {
      formatted = Number.isNaN(value) ? '' : String(Math.round(value))
    } else {
      formatted = String(value)
    }
  } else if (value instanceof Date) {
    formatted = formatCsvDateOnly(value)
  } else if (typeof value === 'string' && isIsoDateString(value)) {
    formatted = formatCsvDateOnly(value)
  } else {
    formatted = String(value)
  }

  if (formatted.trim() === '') return EMPTY_CELL_VALUE
  return formatted
}

export function resolveColumnRaw(
  row: Record<string, unknown>,
  column: ReportColumnDef,
): unknown {
  const { accessor } = column
  if (typeof accessor === 'function') return accessor(row)
  if (!accessor) return undefined
  return getNestedValue(row, accessor)
}

export function resolveColumnCell(
  row: Record<string, unknown>,
  column: ReportColumnDef,
): string {
  return formatReportCellValue(
    resolveColumnRaw(row, column),
    column.format ?? 'text',
  )
}

/* ============================================================
   SHARED COMPUTED ACCESSORS
============================================================ */

export function resolveMainAimAssessor(row: Record<string, unknown>): string {
  const flat = resolveFromPaths(row, [
    'trainer_name',
    'mentor',
    'iqas_name',
    'user_course.trainer_name',
    'learner_id.mentor',
    'learner_id.iqas_name',
  ])

  if (flat != null && String(flat).trim()) {
    return String(flat)
  }

  const trainer =
    (getNestedValue(row, 'trainer_id') as
      | Record<string, unknown>
      | undefined) ??
    (getNestedValue(row, 'user_course.trainer_id') as
      | Record<string, unknown>
      | undefined)

  if (trainer) {
    const full = `${trainer.first_name ?? ''} ${trainer.last_name ?? ''}`.trim()
    if (full) return full
  }

  return ''
}

export function resolveCourseStartDate(row: Record<string, unknown>): unknown {
  return resolveFromPaths(row, [
    'start_date',
    'user_course.start_date',
    'registration_date',
    'learner_id.registration_date',
  ])
}

export function resolveCourseEndDate(row: Record<string, unknown>): unknown {
  return resolveFromPaths(row, [
    'end_date',
    'user_course.end_date',
    'course_expected_end_date',
    'course_actual_end_date',
    'learner_id.course_expected_end_date',
    'learner_id.course_actual_end_date',
  ])
}

function hasOwnKey(row: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(row, key)
}

/**
 * Calendar course timeline % from start→end dates.
 * Do NOT use BE `overall_timeline` — that field is unit green+orange, not calendar progress.
 */
export function computeOverallTimeline(
  row: Record<string, unknown>,
): number | '' {
  const startDateRaw = resolveCourseStartDate(row)
  const endDateRaw = resolveCourseEndDate(row)

  if (!startDateRaw || !endDateRaw) return ''

  const today = new Date()
  const startDate = new Date(String(startDateRaw))
  const endDate = new Date(String(endDateRaw))

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return ''

  const totalDuration =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysPassed =
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

  if (totalDuration <= 0) return 0

  return Math.round(
    Math.min(100, Math.max(0, (daysPassed / totalDuration) * 100)),
  )
}

export function computeWeeksSinceLastReview(
  row: Record<string, unknown>,
): number | '' {
  // Prefer BE enrichment when present (including explicit null → blank).
  if (hasOwnKey(row, 'weeks_since_last_review')) {
    if (row.weeks_since_last_review == null) return ''
    const n = Number(row.weeks_since_last_review)
    return Number.isFinite(n) ? n : ''
  }

  const reviewRaw = resolveFromPaths(row, [
    'last_formal_review',
    'review_date',
  ])

  if (!reviewRaw) return ''

  const reviewDate = new Date(String(reviewRaw))
  if (isNaN(reviewDate.getTime())) return ''

  const diffMs = Date.now() - reviewDate.getTime()
  if (diffMs < 0) return 0

  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
}

/** Course name when API returns a nested course object (e.g. fs_english). */
export function resolveCourseNameField(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const course = value as { course_name?: string }
    return course.course_name ?? ''
  }
  return String(value)
}

/* ============================================================
   OTJ METRICS
============================================================ */

const STATUTORY_LEAVE_WEEKS_PER_YEAR = 5.6
const WEEKS_PER_YEAR = 52
const OTJ_PERCENT = 0.2

interface OtjLogEntry {
  activity_date?: string | Date | null
  spend_time?: string | null
  verified?: boolean
}

export interface OtjMetrics {
  otjRequired: number | null
  requiredToDate: number | null
  totalLoggedHours: number | null
  otjPercentAchieved: number | null
  otjDifferential: number | null
  lastEntryDate: Date | null
}

function daysBetweenInclusive(a: Date, b: Date): number {
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor((b.getTime() - a.getTime()) / oneDay) + 1
}

function parseTimeToHours(spend: string | null | undefined): number {
  if (!spend) return 0
  const s = String(spend).trim()
  if (!s) return 0
  if (s.includes(':')) {
    const [h, m] = s.split(':').map((n) => parseInt(n, 10))
    return (h || 0) + (m || 0) / 60
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const otjMetricsCache = new WeakMap<Record<string, unknown>, OtjMetrics>()

/**
 * OTJ metrics — prefer BE enrichment from getOTJSummary (same as Time Log UI).
 * Fallback: compute from otj_details + course dates when enrichment keys are absent.
 */
const OTJ_ENRICHMENT_KEYS = [
  'off_the_job_hours_required',
  'off_the_job_hours_required_to_date',
  'actual_off_the_job_hours_recorded',
  'actual_off_the_job_percent_achieved',
  'actual_otj_differential_to_date',
  'last_recorded_otj_entry_date',
] as const

function toOtjNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toOtjDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  const d = new Date(String(value))
  return isNaN(d.getTime()) ? null : d
}

function lastEntryFromOtjDetails(row: Record<string, unknown>): Date | null {
  if (!Array.isArray(row.otj_details)) return null
  let lastEntryDate: Date | null = null
  for (const entry of row.otj_details) {
    if (!entry || typeof entry !== 'object') continue
    const activityDate = (entry as OtjLogEntry).activity_date
    if (!activityDate) continue
    const d = new Date(String(activityDate))
    if (!isNaN(d.getTime()) && (!lastEntryDate || d > lastEntryDate)) {
      lastEntryDate = d
    }
  }
  return lastEntryDate
}

function metricsFromEnrichment(row: Record<string, unknown>): OtjMetrics {
  const otjRequired = toOtjNumber(row.off_the_job_hours_required)
  const requiredToDate = toOtjNumber(row.off_the_job_hours_required_to_date)
  const totalLoggedHours = toOtjNumber(row.actual_off_the_job_hours_recorded)

  // Match Off-the-Job summary UI: % and differential vs required-to-date
  let otjPercentAchieved = toOtjNumber(row.actual_off_the_job_percent_achieved)
  let otjDifferential = toOtjNumber(row.actual_otj_differential_to_date)
  if (requiredToDate != null && totalLoggedHours != null) {
    otjPercentAchieved =
      requiredToDate > 0 ? (totalLoggedHours / requiredToDate) * 100 : null
    otjDifferential = totalLoggedHours - requiredToDate
  }

  return {
    otjRequired,
    requiredToDate,
    totalLoggedHours,
    otjPercentAchieved,
    otjDifferential,
    lastEntryDate:
      toOtjDate(row.last_recorded_otj_entry_date) ??
      lastEntryFromOtjDetails(row),
  }
}

function metricsFromOtjDetails(row: Record<string, unknown>): OtjMetrics {
  const userCourse =
    (row.user_course as Record<string, unknown> | null | undefined) ?? null
  const otjLogs = Array.isArray(row.otj_details)
    ? (row.otj_details as OtjLogEntry[])
    : []

  const startRaw =
    userCourse?.start_date ??
    row.start_date ??
    row.registration_date ??
    getNestedValue(row, 'learner_id.registration_date') ??
    null
  const endRaw =
    userCourse?.end_date ??
    row.end_date ??
    row.course_expected_end_date ??
    row.course_actual_end_date ??
    getNestedValue(row, 'learner_id.course_expected_end_date') ??
    getNestedValue(row, 'learner_id.course_actual_end_date') ??
    null

  const startDate = startRaw ? new Date(String(startRaw)) : null
  const endDate = endRaw ? new Date(String(endRaw)) : null
  const startOk = Boolean(startDate && !isNaN(startDate.getTime()))
  const endOk = Boolean(endDate && !isNaN(endDate.getTime()))

  const totalDays =
    startOk && endOk ? daysBetweenInclusive(startDate!, endDate!) : 0

  // Prefer OTJ-summary-style formula (weekly hours) over learner.expected_off_the_job_hours
  // when weekly hours exist — expected hours often diverges from Time Log UI.
  let otjRequired: number | null = null
  const weeklyWorkingHours = resolveFromPaths(row, [
    'weekly_working_hours',
    'learner_id.weekly_working_hours',
  ])
  if (
    totalDays > 0 &&
    weeklyWorkingHours != null &&
    Number(weeklyWorkingHours) > 0
  ) {
    const durationWeeks = totalDays / 7
    const statutoryLeaveWeeks =
      durationWeeks * (STATUTORY_LEAVE_WEEKS_PER_YEAR / WEEKS_PER_YEAR)
    let weeklyHours = Number(weeklyWorkingHours)
    const capDate = new Date('2022-08-01T00:00:00Z')
    if (startOk && startDate! >= capDate) {
      weeklyHours = Math.min(weeklyHours, 30)
    }
    const roundedWeekly = Math.round(weeklyHours)
    const roundedWeeks = Math.round(durationWeeks)
    const roundedLeave = Math.round(statutoryLeaveWeeks * 10) / 10
    const totalApprenticeshipHours =
      roundedWeekly * (roundedWeeks - roundedLeave)
    otjRequired = OTJ_PERCENT * totalApprenticeshipHours
  } else {
    const expectedHours = resolveFromPaths(row, [
      'expected_off_the_job_hours',
      'learner_id.expected_off_the_job_hours',
    ])
    if (expectedHours != null && Number(expectedHours) > 0) {
      otjRequired = Number(expectedHours)
    }
  }

  let requiredToDate: number | null = null
  if (otjRequired != null && startOk && endOk && totalDays > 0) {
    const today = new Date()
    let elapsedDays = 0
    if (today <= startDate!) elapsedDays = 0
    else if (today >= endDate!) elapsedDays = totalDays
    else elapsedDays = daysBetweenInclusive(startDate!, today)
    requiredToDate = (elapsedDays / totalDays) * otjRequired
  }

  let totalLoggedHours: number | null = null
  let lastEntryDate: Date | null = null
  if (Array.isArray(row.otj_details)) {
    const validLogs = otjLogs.filter((log) => log.activity_date)
    totalLoggedHours = validLogs.reduce(
      (sum, log) => sum + parseTimeToHours(log.spend_time),
      0,
    )
    for (const log of validLogs) {
      const d = new Date(String(log.activity_date))
      if (!isNaN(d.getTime()) && (!lastEntryDate || d > lastEntryDate)) {
        lastEntryDate = d
      }
    }
  }

  let otjPercentAchieved: number | null = null
  let otjDifferential: number | null = null
  if (requiredToDate != null && totalLoggedHours != null) {
    otjPercentAchieved =
      requiredToDate > 0 ? (totalLoggedHours / requiredToDate) * 100 : null
    otjDifferential = totalLoggedHours - requiredToDate
  }

  return {
    otjRequired,
    requiredToDate,
    totalLoggedHours,
    otjPercentAchieved,
    otjDifferential,
    lastEntryDate,
  }
}

export function computeOtjMetrics(row: Record<string, unknown>): OtjMetrics {
  const cached = otjMetricsCache.get(row)
  if (cached) return cached

  // Prefer BE enrichment (getOTJSummary) — matches Time Log Off-the-Job summary
  const hasEnrichment = OTJ_ENRICHMENT_KEYS.some((key) => hasOwnKey(row, key))
  if (hasEnrichment) {
    const metrics = metricsFromEnrichment(row)
    otjMetricsCache.set(row, metrics)
    return metrics
  }

  const metrics = metricsFromOtjDetails(row)
  otjMetricsCache.set(row, metrics)
  return metrics
}
