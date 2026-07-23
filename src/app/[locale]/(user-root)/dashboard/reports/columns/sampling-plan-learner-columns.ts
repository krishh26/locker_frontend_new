import type { ReportColumnDef } from '../types'
import {
  getNestedValue,
  resolveFromPaths,
  resolveMainAimAssessor,
} from '../lib/resolve-cell'
import { learnerDisplayName, userDisplayName } from '@/utils/csv-export-helpers'

function resolveLearnerName(row: Record<string, unknown>): string {
  const nested =
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
    'user_course.course.course_name',
    'course.course_name',
    'course_name',
    'samplingPlan.course.course_name',
    'sampling_plan.course.course_name',
  ])
  return value != null ? String(value) : ''
}

function resolveStatus(row: Record<string, unknown>): string {
  const value = resolveFromPaths(row, [
    'user_id.status',
    'learner.user_id.status',
    'user_course.course_status',
    'course_status',
    'status',
    'learner.status',
  ])
  return value != null ? String(value) : ''
}

function resolveAssessorName(row: Record<string, unknown>): string {
  const fromMainAim = resolveMainAimAssessor(row)
  if (fromMainAim) return fromMainAim

  const assessor =
    (getNestedValue(row, 'assessor_id') as Record<string, unknown> | undefined) ??
    (getNestedValue(row, 'assessor') as Record<string, unknown> | undefined) ??
    (getNestedValue(row, 'trainer_id') as Record<string, unknown> | undefined) ??
    (getNestedValue(row, 'samplingPlan.assessor_id') as
      | Record<string, unknown>
      | undefined)

  const fromUser = userDisplayName(assessor)
  if (fromUser) return fromUser

  const flat = resolveFromPaths(row, [
    'assessor_name',
    'trainer_name',
    'iqa_name',
  ])
  return flat != null ? String(flat) : ''
}

/**
 * Shared columns for Learners on / not on a Sampling Plan reports.
 * Both reports reuse this config; only apiType / filter differs.
 */
export const SAMPLING_PLAN_LEARNER_COLUMNS: ReportColumnDef[] = [
  {
    id: 'learner_name',
    header: 'Learner Name',
    accessor: resolveLearnerName,
  },
  {
    id: 'course_name',
    header: 'Course Name',
    accessor: resolveCourseName,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: resolveStatus,
  },
  {
    id: 'assessor_name',
    header: 'Assessor Name',
    accessor: resolveAssessorName,
  },
]
