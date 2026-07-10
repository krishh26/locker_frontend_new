import {
  formatCsvDateOnly,
  formatCsvDateTime,
} from '@/utils/csv-export-helpers'

/**
 * Locker Report spreadsheet column order and API field mapping
 * for Active Learners CSV export.
 */

export const LOCKER_REPORT_COLUMNS = [
  'Learner First Name',
  'Learner Last Name',
  'Main Aim Assessor',
  'Employer Name',
  'Status',
  'ULN',
  'Curriculum Manager Name',
  'Evidence Last Uploaded',
  'Last Feedback',
  'Overall Green',
  'Overall Orange',
  'Overall TimeLine',
  'Main Aim Status',
  'Main Aim Course name',
  'Delivery Model',
  'Course Start Date',
  'Course End Date',
  'Main Green',
  'Main Orange',
  'F Skills ICT',
  'F skill ICT Green',
  'F skill ICT Orange',
  'F skill ICT Status',
  'F Skills Eng',
  'F Skills Eng Green',
  'F Skills Eng Orange',
  'F Skills Eng Status',
  'F Skills Maths',
  'F Skills Maths Green',
  'F Skills Maths Orange',
  'F Skills Maths Status',
  'Tech Cert',
  'Tech Cert Green',
  'Tech Cert Orange',
  'Tech Cert Status',
  'ERR',
  'ERR Green',
  'ERR Orange',
  'ERR Status',
  'PLTS',
  'PLTS Green',
  'PLTS Orange',
  'PLTS Status',
  'Last Visit type',
  'Last Visit Date',
  'Next Visit type',
  'Next Visit Date',
  'Number of week since last review',
  'AssessorComment',
] as const

export type LockerReportColumn = (typeof LOCKER_REPORT_COLUMNS)[number]

export type LockerReportMappingValue =
  | string
  | ((row: Record<string, unknown>) => unknown)

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

/* ============================================================
   FORMATTING + COMPUTED FIELDS
============================================================ */

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

const LOCKER_REPORT_DATE_ONLY_COLUMNS = new Set<LockerReportColumn>([
  'Course Start Date',
  'Course End Date',
  'Last Visit Date',
  'Next Visit Date',
])

const LOCKER_REPORT_DATETIME_COLUMNS = new Set<LockerReportColumn>([
  'Evidence Last Uploaded',
])

export function formatLockerReportValue(
  value: unknown,
  column?: LockerReportColumn,
): string {
  if (value === null || value === undefined) return ''

  if (column && LOCKER_REPORT_DATETIME_COLUMNS.has(column)) {
    return formatCsvDateTime(value)
  }

  if (column && LOCKER_REPORT_DATE_ONLY_COLUMNS.has(column)) {
    return formatCsvDateOnly(value)
  }

  if (value instanceof Date) {
    return formatCsvDateOnly(value)
  }

  if (typeof value === 'string' && isIsoDateString(value)) {
    return formatCsvDateOnly(value)
  }

  return String(value)
}

function getCourseStartDate(row: Record<string, unknown>): string | undefined {
  const fromUserCourse = getNestedValue(row, 'user_course.start_date')
  if (fromUserCourse) return String(fromUserCourse)
  const fallback = row.registration_date
  return fallback != null ? String(fallback) : undefined
}

function getCourseEndDate(row: Record<string, unknown>): string | undefined {
  const fromUserCourse = getNestedValue(row, 'user_course.end_date')
  if (fromUserCourse) return String(fromUserCourse)
  const fallback = row.course_expected_end_date
  return fallback != null ? String(fallback) : undefined
}

export function computeOverallTimeline(
  row: Record<string, unknown>,
): number | '' {
  const startDateRaw = getCourseStartDate(row)
  const endDateRaw = getCourseEndDate(row)

  if (!startDateRaw || !endDateRaw) return ''

  const today = new Date()
  const startDate = new Date(startDateRaw)
  const endDate = new Date(endDateRaw)

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
  const reviewRaw =
    row.review_date ?? row.planned_review_date ?? row.last_review_date

  if (!reviewRaw) return ''

  const reviewDate = new Date(String(reviewRaw))
  if (isNaN(reviewDate.getTime())) return ''

  const diffMs = Date.now() - reviewDate.getTime()
  if (diffMs < 0) return 0

  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
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

export function resolveMainAimAssessor(
  row: Record<string, unknown>,
): string {
  const flat = resolveFromPaths(row, [
    'mentor',
    'manager_name',
    'iqas_name',
    'user_course.trainer_name',
  ])

  if (flat != null && String(flat).trim()) {
    return String(flat)
  }

  const trainer = getNestedValue(row, 'user_course.trainer_id') as
    | Record<string, unknown>
    | undefined

  if (trainer) {
    const full = `${trainer.first_name ?? ''} ${trainer.last_name ?? ''}`.trim()
    if (full) return full
  }

  return ''
}

function resolveCourseStartDate(row: Record<string, unknown>): unknown {
  return resolveFromPaths(row, [
    'user_course.start_date',
    'registration_date',
  ])
}

function resolveCourseEndDate(row: Record<string, unknown>): unknown {
  return resolveFromPaths(row, [
    'user_course.end_date',
    'course_expected_end_date',
    'course_actual_end_date',
  ])
}

function resolveDeliveryModel(row: Record<string, unknown>): unknown {
  return resolveFromPaths(row, [
    'learner_type',
    'funding_body',
    'curriculum_area',
  ])
}

/* ============================================================
   COLUMN MAPPING
============================================================ */

/**
 * Maps Locker Report spreadsheet columns to Active Learners API response keys.
 * Only keys present in GET /learner/list-with-count?type=active_learners are used.
 * Columns with no matching API field export blank.
 */
export const LOCKER_REPORT_MAPPING: Record<
  LockerReportColumn,
  LockerReportMappingValue
> = {
  /* ---- Learner identity ---- */
  'Learner First Name': 'first_name',
  'Learner Last Name': 'last_name',
  'Main Aim Assessor': resolveMainAimAssessor,
  'Employer Name': 'learner_employer_name',
  Status: 'user_id.status',
  ULN: 'uln',
  'Curriculum Manager Name': 'director_of_curriculum',

  'Evidence Last Uploaded': 'evidence_last_uploaded',
  'Last Feedback': 'last_feedback',

  /* ---- Progress (main aim used for overall until dedicated fields exist) ---- */
  'Overall Green': 'main_aim_green_progress',
  'Overall Orange': 'main_aim_orange_progress',
  'Overall TimeLine': computeOverallTimeline,

  /* ---- Main aim course (user_course.*) ---- */
  'Main Aim Status': 'user_course.course_status',
  'Main Aim Course name': 'user_course.course.course_name',
  'Delivery Model': resolveDeliveryModel,
  'Course Start Date': resolveCourseStartDate,
  'Course End Date': resolveCourseEndDate,
  'Main Green': 'main_aim_green_progress',
  'Main Orange': 'main_aim_orange_progress',

  /* ---- Functional skills ICT ---- */
  'F Skills ICT': 'fs_ict',
  'F skill ICT Green': 'fs_ict_green_progress',
  'F skill ICT Orange': 'fs_ict_orange_progress',
  'F skill ICT Status': 'fSkillICTStatus',

  /* ---- Functional skills English ---- */
  'F Skills Eng': 'fs_english',
  'F Skills Eng Green': 'fs_english_green_progress',
  'F Skills Eng Orange': 'fs_english_orange_progress',
  'F Skills Eng Status': 'fSkillsEngStatus',

  /* ---- Functional skills Maths ---- */
  'F Skills Maths': 'fs_maths',
  'F Skills Maths Green': 'fs_maths_green_progress',
  'F Skills Maths Orange': 'fs_maths_orange_progress',
  'F Skills Maths Status': 'fSkillsMathsStatus',

  /* ---- Tech Cert / ERR / PLTS ---- */
  'Tech Cert': 'techCert',
  'Tech Cert Green': 'techCertGreen',
  'Tech Cert Orange': 'techCertOrange',
  'Tech Cert Status': 'techCertStatus',
  ERR: 'err',
  'ERR Green': 'errGreen',
  'ERR Orange': 'errOrange',
  'ERR Status': 'errStatus',
  PLTS: 'plts',
  'PLTS Green': 'pltsGreen',
  'PLTS Orange': 'pltsOrange',
  'PLTS Status': 'pltsStatus',

  /* ---- Visits & review ---- */
  'Last Visit type': 'last_visit_type',
  'Last Visit Date': 'last_visit_date',
  'Next Visit type': 'next_visit_type',
  'Next Visit Date': 'next_visit_date',
  'Number of week since last review': computeWeeksSinceLastReview,
  AssessorComment: 'comment',
}

/* ============================================================
   ROW TRANSFORM
============================================================ */

export function flattenRowForCsv(
  row: Record<string, unknown>,
): Record<LockerReportColumn, string> {
  const result = {} as Record<LockerReportColumn, string>

  for (const column of LOCKER_REPORT_COLUMNS) {
    const mapping = LOCKER_REPORT_MAPPING[column]
    let raw: unknown

    if (typeof mapping === 'function') {
      raw = mapping(row)
    } else if (mapping === '') {
      raw = undefined
    } else {
      raw = getNestedValue(row, mapping)
    }

    result[column] = formatLockerReportValue(raw, column)
  }

  return result
}

export function buildLockerReportCsvRows(
  rows: Record<string, unknown>[],
): { headers: string; dataRows: string[] } {
  const flatRows = rows.map((row) => flattenRowForCsv(row))

  const headers = LOCKER_REPORT_COLUMNS.map(
    (h) => `"${h.replace(/"/g, '""')}"`,
  ).join(',')

  const dataRows = flatRows.map((row) =>
    LOCKER_REPORT_COLUMNS.map((col) => {
      const value = row[col] ?? ''
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(','),
  )

  return { headers, dataRows }
}
