import type { ReportColumnDef } from '../types'
import { getNestedValue, resolveFromPaths } from '../lib/resolve-cell'

/**
 * Learners in Gateway — columns mapped to `gateway_learners` UserCourse rows.
 *
 * Present on API: learner_id.*, course (JSON), start_date, end_date, created_at.
 * Sign-off columns look up suggested keys only; they stay N/A until backend adds them.
 */

function resolveGatewayChecklistProgress(
  row: Record<string, unknown>,
): unknown {
  const explicit = resolveFromPaths(row, [
    'gateway_checklist_progress',
    'checklist_progress',
  ])
  if (explicit != null) return explicit

  const questions = getNestedValue(row, 'course.questions')
  if (!Array.isArray(questions) || questions.length === 0) return undefined

  const achieved = questions.filter(
    (q) =>
      q != null &&
      typeof q === 'object' &&
      (q as { achieved?: boolean }).achieved === true,
  ).length

  return Math.round((achieved / questions.length) * 100)
}

/**
 * Shared column set for the Learners in Gateway dashboard report.
 */
export const GATEWAY_LEARNERS_REPORT_COLUMNS: ReportColumnDef[] = [
  {
    id: 'learner_first_name',
    header: 'Learner First Name',
    accessor: (row) =>
      resolveFromPaths(row, ['learner_id.first_name', 'first_name']),
  },
  {
    id: 'learner_last_name',
    header: 'Learner Last Name',
    accessor: (row) =>
      resolveFromPaths(row, ['learner_id.last_name', 'last_name']),
  },
  {
    id: 'gateway_name',
    header: 'Gateway Name',
    accessor: (row) =>
      resolveFromPaths(row, ['course.course_name', 'course_name']),
  },
  {
    id: 'gateway_created_date',
    header: 'Gateway Created Date',
    accessor: (row) =>
      resolveFromPaths(row, ['created_at', 'course.created_at']),
    format: 'date',
  },
  {
    id: 'gateway_start_date',
    header: 'Gateway Start Date',
    accessor: (row) => resolveFromPaths(row, ['start_date']),
    format: 'date',
  },
  {
    id: 'gateway_end_date',
    header: 'Gateway End Date',
    accessor: (row) => resolveFromPaths(row, ['end_date']),
    format: 'date',
  },
  {
    id: 'gateway_checklist_progress',
    header: 'Gateway Checklist Progress %',
    accessor: resolveGatewayChecklistProgress,
    format: 'percent',
  },
  {
    id: 'date_assessor_signed_off',
    header: 'Date Assessor Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'date_assessor_signed_off',
        'assessor_signed_off_at',
      ]),
    format: 'date',
  },
  {
    id: 'assessor_name_signed_off',
    header: 'Assessor Name Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'assessor_name_signed_off',
        'assessor_signed_off_by',
      ]),
  },
  {
    id: 'date_employer_signed_off',
    header: 'Date Employer Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'date_employer_signed_off',
        'employer_signed_off_at',
      ]),
    format: 'date',
  },
  {
    id: 'employer_name_signed_off',
    header: 'Employer Name Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'employer_name_signed_off',
        'employer_signed_off_by',
      ]),
  },
  {
    id: 'date_learner_signed_off',
    header: 'Date Learner Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'date_learner_signed_off',
        'learner_signed_off_at',
      ]),
    format: 'date',
  },
  {
    id: 'date_checklist_signed_off',
    header: 'Date Checklist Signed Off',
    accessor: (row) =>
      resolveFromPaths(row, [
        'date_checklist_signed_off',
        'checklist_signed_off_at',
      ]),
    format: 'date',
  },
]
