/**
 * Learner Management CSV export — one row per course enrolment.
 * Progress uses convertToMatrixData (same as learner dashboard).
 */

import {
  buildCsvString,
  formatCsvDateOnly,
  formatText,
  formatYesNo,
  userDisplayName,
} from '@/utils/csv-export-helpers'
import { convertToMatrixData } from '@/lib/learner-progress-utils'
import type { LearnerCourse, LearnerListItem } from '@/store/api/learner/types'

export const LEARNER_MANAGEMENT_CSV_HEADERS = [
  'Learner First Name',
  'Learner Last Name',
  'Email',
  'Funding Body',
  'Course',
  'Percent Complete',
  'Course Status',
  'Course Start',
  'Course End',
  'National Insurance No',
  'Date of Birth',
  'Gender',
  'Ethnicity',
  'Home Postcode',
  'Telephone Number',
  'Mobile',
  'Learner Disability',
  'Learning Difficulties',
  'Manager Name',
  'Manager Job Title',
  'Mentor',
  'Employer Name',
  'Address line 1',
  'Address line 2',
  'Address line 3',
  'Address line 4',
  'Town',
  'Postcode',
  'Assessor',
  'Archived',
  'Assessor First Name',
  'Assessor Last Name',
  'Awarding Body',
  'Registration Date',
  'Registration Number',
] as const

function getCoursePercentComplete(course: LearnerCourse): string {
  const progress = convertToMatrixData(course)
  if (progress.totalUnits <= 0) return ''
  const pct =
    (progress.fullyCompleted / progress.totalUnits) * 100 +
    (progress.workInProgress / progress.totalUnits) * 50
  return String(Math.round(pct * 100) / 100)
}

function getTrainer(course: LearnerCourse): Record<string, unknown> | null {
  const trainer = course.trainer_id
  if (!trainer || typeof trainer !== 'object') return null
  return trainer as Record<string, unknown>
}

function getEmployerName(learner: LearnerListItem): string {
  const employer = learner.employer_id
  if (!employer || typeof employer !== 'object') return ''
  return formatText(
    (employer as { employer_name?: string | null }).employer_name,
  )
}

function learnerField(learner: LearnerListItem, key: string): string {
  return formatText((learner as unknown as Record<string, unknown>)[key])
}

function learnerRaw(learner: LearnerListItem, key: string): unknown {
  return (learner as unknown as Record<string, unknown>)[key]
}

/** Expand learners × courses into flat export rows. */
export function flattenLearnersForExport(
  learners: LearnerListItem[],
): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = []

  for (const learner of learners) {
    const courses = Array.isArray(learner.course) ? learner.course : []
    if (courses.length === 0) {
      rows.push({ learner, course: null })
      continue
    }
    for (const course of courses) {
      rows.push({ learner, course })
    }
  }

  return rows
}

function rowToCells(
  learner: LearnerListItem,
  course: LearnerCourse | null,
): string[] {
  const trainer = course ? getTrainer(course) : null
  const courseMeta =
    course?.course && typeof course.course === 'object'
      ? (course.course as Record<string, unknown>)
      : null

  return [
    formatText(learner.first_name),
    formatText(learner.last_name),
    formatText(learner.email),
    formatText(learner.funding_body),
    courseMeta ? formatText(courseMeta.course_name) : '',
    course ? getCoursePercentComplete(course) : '',
    course ? formatText(course.course_status) : '',
    course ? formatCsvDateOnly(course.start_date) : '',
    course ? formatCsvDateOnly(course.end_date) : '',
    formatText(learner.national_ins_no),
    formatCsvDateOnly(learnerRaw(learner, 'dob')),
    learnerField(learner, 'gender'),
    learnerField(learner, 'ethnicity'),
    learnerField(learner, 'home_postcode'),
    learnerField(learner, 'telephone'),
    formatText(learner.mobile),
    learnerField(learner, 'learner_disability'),
    learnerField(learner, 'learning_difficulties'),
    learnerField(learner, 'manager_name'),
    learnerField(learner, 'manager_job_title'),
    learnerField(learner, 'mentor'),
    getEmployerName(learner),
    learnerField(learner, 'street'),
    learnerField(learner, 'suburb'),
    learnerField(learner, 'county'),
    learnerField(learner, 'country'),
    learnerField(learner, 'town'),
    learnerField(learner, 'home_postcode'),
    trainer ? userDisplayName(trainer) : '',
    formatYesNo(learnerRaw(learner, 'deleted_at') != null),
    trainer ? formatText(trainer.first_name) : '',
    trainer ? formatText(trainer.last_name) : '',
    courseMeta ? formatText(courseMeta.awarding_body) : '',
    formatCsvDateOnly(learnerRaw(learner, 'registration_date')),
    learnerField(learner, 'registration_number'),
  ]
}

export function buildLearnerManagementExportRows(
  learners: LearnerListItem[],
): { headers: string[]; rows: string[][] } {
  const flat = flattenLearnersForExport(learners)
  const rows = flat.map((row) =>
    rowToCells(
      row.learner as LearnerListItem,
      (row.course as LearnerCourse | null) ?? null,
    ),
  )
  return {
    headers: [...LEARNER_MANAGEMENT_CSV_HEADERS],
    rows,
  }
}

export function buildLearnerManagementCsv(learners: LearnerListItem[]): string {
  const { headers, rows } = buildLearnerManagementExportRows(learners)
  return buildCsvString([headers, ...rows])
}
