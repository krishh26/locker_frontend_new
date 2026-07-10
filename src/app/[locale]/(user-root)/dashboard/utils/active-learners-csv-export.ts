/** Active learners CSV – column order and labels match the reference Excel sheet. */

import {
  formatCsvDateOnly,
  formatCsvDateTime,
} from '@/utils/csv-export-helpers'

export const ACTIVE_LEARNERS_CSV_HEADERS = [
  'Learner First Name',
  'Learner Last Name',
  'Main Aim Assessor',
  'Employer Name',
  'Status',
  'ULN',
  'Line Manager Name',
  'Evidence Last Uploaded',
  'Last Feedback',
  'Overall Green',
  'Overall Orange',
  'Overall Timeline',
  'Main Aim Status',
  'Main Aim Course Name',
  'Course Start Date',
  'Course End Date',
  'Main Green',
  'Main Orange',
  'F Skills Eng',
  'F Skills Eng Green',
  'F Skills Eng Orange',
  'F Skills Eng Status',
  'F Skills Maths',
  'F Skills Maths Green',
  'F Skills Maths Orange',
  'F Skills Maths Status',
  'Last Visit Type',
  'Last Visit Date',
  'Next Visit Type',
  'Next Visit Date',
  'Number of Weeks Since Last Review',
  'Assessor Comment',
  'Learner Type',
  'Last Formal Review',
  'Off the Job Hours Required',
  'Off the Job Hours Required to Date',
  'Actual Off the Job Hours Recorded',
  'Actual OTJ Differential to Date',
  'Last Recorded OTJ Entry Date',
] as const

const DEFAULT_WEEKLY_HOURS = 30
const STATUTORY_LEAVE_WEEKS_PER_YEAR = 5.6
const WEEKS_PER_YEAR = 52
const OTJ_PERCENT = 0.2

interface OtjLogEntry {
  activity_date?: string | Date | null
  spend_time?: string | null
  verified?: boolean
}

interface OtjMetrics {
  otjRequired: number
  requiredToDate: number
  totalLoggedHours: number
  otjDifferential: number
  lastEntryDate: Date | null
}

function parsePercentage(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    return Number(value.replace('%', '').trim()) || 0
  }
  return 0
}

function formatProgressValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'string' && value.includes('%')) {
    return String(Math.round(parsePercentage(value)))
  }
  return String(value)
}

function formatCsvNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return Number(value.toFixed(decimals)).toString()
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

function computeTimelineProgress(
  startDate: unknown,
  endDate: unknown,
): number {
  if (!startDate || !endDate) return 0
  const start = new Date(String(startDate))
  const end = new Date(String(endDate))
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

  const totalDuration =
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const daysPassed =
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
  if (totalDuration <= 0) return 0
  return Math.min(
    100,
    Math.max(0, Math.round((daysPassed / totalDuration) * 100)),
  )
}

function computeOtjMetrics(
  row: Record<string, unknown>,
  userCourse: Record<string, unknown> | null,
  otjLogs: OtjLogEntry[],
): OtjMetrics {
  const startDate = userCourse?.start_date
    ? new Date(String(userCourse.start_date))
    : null
  const endDate = userCourse?.end_date
    ? new Date(String(userCourse.end_date))
    : null

  const totalDays =
    startDate &&
    endDate &&
    !isNaN(startDate.getTime()) &&
    !isNaN(endDate.getTime())
      ? daysBetweenInclusive(startDate, endDate)
      : 0

  const durationWeeks = totalDays / 7
  const statutoryLeaveWeeks =
    durationWeeks * (STATUTORY_LEAVE_WEEKS_PER_YEAR / WEEKS_PER_YEAR)

  let weeklyHours = row.weekly_working_hours
    ? Number(row.weekly_working_hours)
    : DEFAULT_WEEKLY_HOURS

  const capDate = new Date('2022-08-01T00:00:00Z')
  if (startDate && startDate >= capDate) {
    weeklyHours = Math.min(weeklyHours, 30)
  }

  const roundedWeekly = Math.round(weeklyHours)
  const roundedWeeks = Math.round(durationWeeks)
  const roundedLeave = Math.round(statutoryLeaveWeeks * 10) / 10
  const totalApprenticeshipHours = roundedWeekly * (roundedWeeks - roundedLeave)
  let otjRequired = OTJ_PERCENT * totalApprenticeshipHours

  if (
    row.expected_off_the_job_hours != null &&
    Number(row.expected_off_the_job_hours) > 0
  ) {
    otjRequired = Number(row.expected_off_the_job_hours)
  }

  let requiredToDate = 0
  if (startDate && endDate && totalDays > 0) {
    const today = new Date()
    let elapsedDays = 0
    if (today <= startDate) elapsedDays = 0
    else if (today >= endDate) elapsedDays = totalDays
    else elapsedDays = daysBetweenInclusive(startDate, today)
    requiredToDate = (elapsedDays / totalDays) * otjRequired
  }

  const validLogs = otjLogs.filter((log) => log.activity_date)
  const totalLoggedHours = validLogs.reduce(
    (sum, log) => sum + parseTimeToHours(log.spend_time),
    0,
  )

  let lastEntryDate: Date | null = null
  for (const log of validLogs) {
    const d = new Date(String(log.activity_date))
    if (!isNaN(d.getTime()) && (!lastEntryDate || d > lastEntryDate)) {
      lastEntryDate = d
    }
  }

  return {
    otjRequired,
    requiredToDate,
    totalLoggedHours,
    otjDifferential: totalLoggedHours - requiredToDate,
    lastEntryDate,
  }
}

function fsCourseName(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const course = value as { course_name?: string }
  return course.course_name ?? ''
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function rowToCells(row: Record<string, unknown>): string[] {
  const userCourse = (row.user_course as Record<string, unknown> | null) ?? null
  const course = (userCourse?.course as Record<string, unknown> | null) ?? null
  const userId = row.user_id as Record<string, unknown> | null | undefined
  const otjLogs = (row.otj_details as OtjLogEntry[] | undefined) ?? []

  const overallGreen = Math.round(parsePercentage(row.main_aim_green_progress))
  const overallOrange = Math.round(
    parsePercentage(row.main_aim_orange_progress),
  )
  const otj = computeOtjMetrics(row, userCourse, otjLogs)

  return [
    String(row.first_name ?? ''),
    String(row.last_name ?? ''),
    '',
    String(row.learner_employer_name ?? ''),
    String(userId?.status ?? ''),
    String(row.uln ?? ''),
    String(row.manager_name ?? ''),
    formatCsvDateTime(row.evidence_last_uploaded),
    formatCsvDateTime(row.last_feedback),
    String(overallGreen),
    String(overallOrange),
    String(computeTimelineProgress(userCourse?.start_date, userCourse?.end_date)),
    String(userCourse?.course_status ?? ''),
    String(course?.course_name ?? ''),
    formatCsvDateOnly(userCourse?.start_date),
    formatCsvDateOnly(userCourse?.end_date),
    formatProgressValue(row.main_aim_green_progress),
    formatProgressValue(row.main_aim_orange_progress),
    fsCourseName(row.fs_english),
    formatProgressValue(row.fs_english_green_progress),
    formatProgressValue(row.fs_english_orange_progress),
    String(row.fSkillsEngStatus ?? ''),
    fsCourseName(row.fs_maths),
    formatProgressValue(row.fs_maths_green_progress),
    formatProgressValue(row.fs_maths_orange_progress),
    String(row.fSkillsMathsStatus ?? ''),
    String(row.last_visit_type ?? ''),
    formatCsvDateTime(row.last_visit_date),
    String(row.next_visit_type ?? ''),
    formatCsvDateTime(row.next_visit_date),
    '',
    String(row.comment ?? ''),
    String(row.learner_type ?? ''),
    '',
    formatCsvNumber(otj.otjRequired),
    formatCsvNumber(otj.requiredToDate),
    formatCsvNumber(otj.totalLoggedHours),
    formatCsvNumber(otj.otjDifferential),
    formatCsvDateTime(otj.lastEntryDate),
  ]
}

export function buildActiveLearnersCsv(rows: Record<string, unknown>[]): string {
  const colCount = ACTIVE_LEARNERS_CSV_HEADERS.length
  const summaryRow = [
    `${rows.length} Records found`,
    ...Array(colCount - 1).fill(''),
  ]
  const headerRow = [...ACTIVE_LEARNERS_CSV_HEADERS]
  const dataRows = rows.map((row) => rowToCells(row))

  return [summaryRow, headerRow, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')
}
