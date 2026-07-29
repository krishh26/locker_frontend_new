import type { ReportColumnDef } from '../types'
import { STANDARD_ASSESSMENT_METHODS } from '@/config/assessment-methods'

/** Full titles matching Assessment Methods screen (`messages.assessmentMethods.*.title`). */
const ASSESSMENT_METHOD_TITLES: Record<string, string> = {
  PE: 'Professional Discussion',
  DO: 'Direct Observation',
  WT: 'Witness Testimony',
  QA: 'Question and Answer',
  PS: 'Product Sample',
  DI: 'Discussion',
  SI: 'Simulation',
  ET: 'Expert Evidence',
  RA: 'Basic Assessment',
  OT: 'Other',
  RPL: 'Individual Personal Log',
}

/**
 * Same 11 methods / order / apiKeys as the Trainer Risk Rating Assessment Methods screen.
 * Headers: `PE (Professional Discussion)`, etc. Match API codes exactly (no aliases).
 * LO is excluded.
 */
export const TRAINER_RAG_ASSESSMENT_METHOD_COLUMNS: ReadonlyArray<{
  header: string
  apiCode: string
}> = STANDARD_ASSESSMENT_METHODS.map((method) => ({
  header: `${method.code} (${ASSESSMENT_METHOD_TITLES[method.code] ?? method.code})`,
  apiCode: method.apiKey,
}))

export function getTrainerCourses(
  row: Record<string, unknown>,
): Record<string, unknown>[] {
  const courses = row.courses
  if (!Array.isArray(courses)) return []
  return courses.filter(
    (course): course is Record<string, unknown> =>
      course != null && typeof course === 'object',
  )
}

/** Exact-code lookup only — no frontend/backend code aliases. */
export function getAssessmentMethodRiskLevel(
  row: Record<string, unknown>,
  apiCode: string,
): string {
  const methods = row.assessment_methods
  if (methods == null) return ''

  if (Array.isArray(methods)) {
    for (const entry of methods) {
      if (!entry || typeof entry !== 'object') continue
      const item = entry as Record<string, unknown>
      if (String(item.assessment_method ?? '') !== apiCode) continue
      const level = item.risk_level
      return level == null ? '' : String(level)
    }
    return ''
  }

  if (typeof methods === 'object') {
    const record = methods as Record<string, unknown>
    if (!(apiCode in record)) return ''
    const value = record[apiCode]
    if (value == null) return ''
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'object') {
      const level = (value as Record<string, unknown>).risk_level
      return level == null ? '' : String(level)
    }
  }

  return ''
}

export function formatRiskPercentage(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const raw = String(value).trim()
  if (!raw) return ''
  if (raw.endsWith('%')) return raw
  const n = Number(raw)
  if (Number.isNaN(n)) return raw
  return `${n}%`
}

export function resolveTrainerDisplayName(row: Record<string, unknown>): string {
  const trainer =
    row.trainer && typeof row.trainer === 'object'
      ? (row.trainer as Record<string, unknown>)
      : null
  if (!trainer) return ''
  return `${trainer.first_name ?? ''} ${trainer.last_name ?? ''}`.trim()
}

function collectCourseNames(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []

  for (const row of rows) {
    for (const course of getTrainerCourses(row)) {
      const name = String(course.course_name ?? '').trim()
      if (!name || seen.has(name)) continue
      seen.add(name)
      names.push(name)
    }
  }

  return names
}

function courseRiskAccessor(courseName: string) {
  return (row: Record<string, unknown>): string => {
    const match = getTrainerCourses(row).find(
      (course) => String(course.course_name ?? '').trim() === courseName,
    )
    if (!match) return ''
    const level = match.overall_risk_level
    return level == null ? '' : String(level)
  }
}

/**
 * Column order:
 * Trainer Name → dynamic courses → High/Medium/Low Risk % → assessment methods
 */
export function buildTrainerRagReportColumns(
  rows: Record<string, unknown>[],
): ReportColumnDef[] {
  const courseColumns: ReportColumnDef[] = collectCourseNames(rows).map(
    (courseName) => ({
      id: `course_${courseName}`,
      header: courseName,
      accessor: courseRiskAccessor(courseName),
    }),
  )

  const assessmentColumns: ReportColumnDef[] =
    TRAINER_RAG_ASSESSMENT_METHOD_COLUMNS.map(({ header, apiCode }) => ({
      id: `assessment_${apiCode}`,
      header,
      accessor: (row: Record<string, unknown>) =>
        getAssessmentMethodRiskLevel(row, apiCode),
    }))

  return [
    {
      id: 'trainer_name',
      header: 'Trainer Name',
      accessor: resolveTrainerDisplayName,
    },
    ...courseColumns,
    {
      id: 'high_risk_percent',
      header: 'High Risk %',
      accessor: (row) => formatRiskPercentage(row.high_percentage),
    },
    {
      id: 'medium_risk_percent',
      header: 'Medium Risk %',
      accessor: (row) => formatRiskPercentage(row.medium_percentage),
    },
    {
      id: 'low_risk_percent',
      header: 'Low Risk %',
      accessor: (row) => formatRiskPercentage(row.low_percentage),
    },
    ...assessmentColumns,
  ]
}
