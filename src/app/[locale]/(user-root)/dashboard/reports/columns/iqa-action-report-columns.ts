import type { ReportColumnDef } from '../types'
import { getNestedValue, resolveFromPaths } from '../lib/resolve-cell'
import { learnerDisplayName, userDisplayName } from '@/utils/csv-export-helpers'

/**
 * Shared columns for IQA action / sampling-due / EQA action dashboard reports.
 *
 * IQA action rows: SamplingPlanAction with nested plan_detail → learner / samplingPlan.
 * Sampling due rows: SamplingPlanDetail with learner / samplingPlan at the root.
 */

function resolveLearnerName(row: Record<string, unknown>): string {
  const nested =
    (getNestedValue(row, 'plan_detail.learner') as
      | Record<string, unknown>
      | undefined) ??
    (row.learner as Record<string, unknown> | undefined) ??
    (row.learner_id as Record<string, unknown> | undefined)

  const fromNested = nested ? learnerDisplayName(nested) : ''
  if (fromNested) return fromNested

  const fromRoot = learnerDisplayName(row)
  if (fromRoot) return fromRoot

  return String(
    resolveFromPaths(row, ['user_name', 'learner.user_name']) ?? '',
  )
}

function resolveCourseName(row: Record<string, unknown>): string {
  const value = resolveFromPaths(row, [
    'plan_detail.samplingPlan.course.course_name',
    'plan_detail.sampling_plan.course.course_name',
    'samplingPlan.course.course_name',
    'sampling_plan.course.course_name',
    'user_course.course.course_name',
    'course.course_name',
    'course_name',
  ])
  return value != null ? String(value) : ''
}

function resolvePersonName(
  row: Record<string, unknown>,
  userPaths: string[],
  flatPaths: string[],
): string {
  for (const path of userPaths) {
    const user = getNestedValue(row, path)
    if (user && typeof user === 'object' && !Array.isArray(user)) {
      const name = userDisplayName(user as Record<string, unknown>)
      if (name) return name
    }
  }

  const flat = resolveFromPaths(row, flatPaths)
  return flat != null ? String(flat) : ''
}

function resolveIqaName(row: Record<string, unknown>): string {
  return resolvePersonName(
    row,
    [
      'plan_detail.samplingPlan.iqa',
      'plan_detail.sampling_plan.iqa',
      'samplingPlan.iqa',
      'sampling_plan.iqa',
      'created_by',
      'action_with',
      'iqa',
      'IQA_id',
    ],
    ['iqa_name', 'iqas_name'],
  )
}

function resolveEqaName(row: Record<string, unknown>): string {
  return resolvePersonName(
    row,
    [
      'eqa',
      'eqa_id',
      'EQA_id',
      'action_with',
      'created_by',
      'plan_detail.samplingPlan.iqa',
      'samplingPlan.iqa',
      'sampling_plan.iqa',
    ],
    ['eqa_name', 'iqa_name'],
  )
}

/** Shared building blocks — reuse across IQA / sampling / EQA configs. */
export const IQA_LEARNER_NAME_COLUMN: ReportColumnDef = {
  id: 'learner_name',
  header: 'Learner Name',
  accessor: resolveLearnerName,
}

export const IQA_COURSE_NAME_COLUMN: ReportColumnDef = {
  id: 'course_name',
  header: 'Course Name',
  accessor: resolveCourseName,
}

export const ACTION_OUTSTANDING_COLUMN: ReportColumnDef = {
  id: 'action_outstanding',
  header: 'Action Outstanding',
  accessor: (row) =>
    resolveFromPaths(row, [
      'action_required',
      'action_outstanding',
      'action_name',
      'Actions',
      'action',
    ]),
}

export const TARGET_DATE_COLUMN: ReportColumnDef = {
  id: 'target_date',
  header: 'Target Date',
  accessor: (row) =>
    resolveFromPaths(row, [
      'target_date',
      'plannedDate',
      'planned_date',
      'action_due_date',
      'due_date',
    ]),
  format: 'date',
}

export const IQA_NAME_COLUMN: ReportColumnDef = {
  id: 'iqa_name',
  header: 'IQA Name',
  accessor: resolveIqaName,
}

/**
 * IQA Actions Overdue / All IQA Actions / IQA Actions Due in 30 Days.
 */
export const IQA_ACTION_REPORT_COLUMNS: ReportColumnDef[] = [
  IQA_LEARNER_NAME_COLUMN,
  IQA_COURSE_NAME_COLUMN,
  ACTION_OUTSTANDING_COLUMN,
  TARGET_DATE_COLUMN,
  IQA_NAME_COLUMN,
]

/**
 * Sample Due in Month / Sampling Plan Overdue —
 * same as IQA action columns without Action Outstanding.
 */
export const SAMPLING_DUE_REPORT_COLUMNS: ReportColumnDef[] =
  IQA_ACTION_REPORT_COLUMNS.filter((col) => col.id !== 'action_outstanding')

/** EQA overrides of IQA columns — only what differs. */
export const EQA_ACTIONS_OUTSTANDING_COLUMN: ReportColumnDef = {
  ...ACTION_OUTSTANDING_COLUMN,
  id: 'eqa_actions_outstanding',
  header: 'EQA Actions Outstanding',
  accessor: (row) =>
    resolveFromPaths(row, [
      'eqa_actions_outstanding',
      'action_required',
      'action_outstanding',
      'action_name',
      'Actions',
      'action',
    ]),
}

export const EQA_ACTION_COLUMN: ReportColumnDef = {
  id: 'eqa_action',
  header: 'EQA Action',
  accessor: (row) =>
    resolveFromPaths(row, [
      'eqa_action',
      'eqa_action_type',
      'action_type',
      'action_name',
      'Actions',
      'action',
    ]),
}

export const EQA_NAME_COLUMN: ReportColumnDef = {
  ...IQA_NAME_COLUMN,
  id: 'eqa_name',
  header: 'EQA Name',
  accessor: resolveEqaName,
}

/**
 * Outstanding EQA Actions — IQA column set with Action Outstanding →
 * EQA Actions Outstanding + EQA Action, and IQA Name → EQA Name.
 */
export const EQA_ACTION_REPORT_COLUMNS: ReportColumnDef[] =
  IQA_ACTION_REPORT_COLUMNS.flatMap((col) => {
    if (col.id === 'action_outstanding') {
      return [EQA_ACTIONS_OUTSTANDING_COLUMN, EQA_ACTION_COLUMN]
    }
    if (col.id === 'iqa_name') {
      return [EQA_NAME_COLUMN]
    }
    return [col]
  })
