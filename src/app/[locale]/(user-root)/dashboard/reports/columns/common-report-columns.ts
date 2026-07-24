import type { ReportColumnDef } from '../types'
import {
  computeOverallTimeline,
  computeOtjMetrics,
  computeWeeksSinceLastReview,
  resolveCourseEndDate,
  resolveCourseNameField,
  resolveCourseStartDate,
  resolveFromPaths,
  resolveMainAimAssessor,
  getNestedValue,
} from '../lib/resolve-cell'

/**
 * Shared base columns for all admin dashboard learner reports.
 * Report-specific configs should spread this array and append extras later.
 */
export const COMMON_REPORT_COLUMNS: ReportColumnDef[] = [
  {
    id: 'learner_first_name',
    header: 'Learner First Name',
    accessor: (row) =>
      resolveFromPaths(row, ['first_name', 'learner_id.first_name']),
  },
  {
    id: 'learner_last_name',
    header: 'Learner Last Name',
    accessor: (row) =>
      resolveFromPaths(row, ['last_name', 'learner_id.last_name']),
  },
  {
    id: 'main_aim_assessor',
    header: 'Main Aim Assessor',
    accessor: resolveMainAimAssessor,
  },
  {
    id: 'employer_name',
    header: 'Employer Name',
    accessor: (row) =>
      resolveFromPaths(row, [
        'learner_employer_name',
        'employer_name',
        'learner_id.learner_employer_name',
      ]),
  },
  {
    id: 'status',
    header: 'Status',
    accessor: (row) =>
      resolveFromPaths(row, [
        'user_id.status',
        'user_course.course_status',
        'status',
        'learner_id.user_id.status',
      ]),
  },
  {
    id: 'uln',
    header: 'ULN',
    accessor: (row) => resolveFromPaths(row, ['uln', 'learner_id.uln']),
  },
  {
    id: 'curriculum_manager_name',
    header: 'Curriculum Manager Name',
    accessor: 'director_of_curriculum',
  },
  {
    id: 'evidence_last_uploaded',
    header: 'Evidence Last Uploaded',
    accessor: 'evidence_last_uploaded',
    format: 'datetime',
  },
  {
    id: 'last_feedback',
    header: 'Last Feedback',
    accessor: 'last_feedback',
    format: 'datetime',
  },
  {
    id: 'overall_green',
    header: 'Overall Green',
    accessor: 'main_aim_green_progress',
    format: 'percent',
  },
  {
    id: 'overall_orange',
    header: 'Overall Orange',
    accessor: 'main_aim_orange_progress',
    format: 'percent',
  },
  {
    id: 'overall_timeline',
    header: 'Overall TimeLine',
    accessor: computeOverallTimeline,
  },
  {
    id: 'main_aim_status',
    header: 'Main Aim Status',
    accessor: (row) =>
      resolveFromPaths(row, [
        'user_course.course_status',
        'course_status',
      ]),
  },
  {
    id: 'main_aim_course_name',
    header: 'Main Aim Course name',
    accessor: (row) =>
      resolveFromPaths(row, [
        'user_course.course.course_name',
        'course.course_name',
        'course_name',
      ]),
  },
  {
    id: 'course_start_date',
    header: 'Course Start Date',
    accessor: resolveCourseStartDate,
    format: 'date',
  },
  {
    id: 'course_end_date',
    header: 'Course End Date',
    accessor: resolveCourseEndDate,
    format: 'date',
  },
  {
    id: 'main_green',
    header: 'Main Green',
    accessor: 'main_aim_green_progress',
    format: 'percent',
  },
  {
    id: 'main_orange',
    header: 'Main Orange',
    accessor: 'main_aim_orange_progress',
    format: 'percent',
  },
  {
    id: 'f_skills_eng',
    header: 'F Skills Eng',
    accessor: (row) => resolveCourseNameField(getNestedValue(row, 'fs_english')),
  },
  {
    id: 'f_skills_eng_green',
    header: 'F Skills Eng Green',
    accessor: 'fs_english_green_progress',
    format: 'percent',
  },
  {
    id: 'f_skills_eng_orange',
    header: 'F Skills Eng Orange',
    accessor: 'fs_english_orange_progress',
    format: 'percent',
  },
  {
    id: 'f_skills_eng_status',
    header: 'F Skills Eng Status',
    accessor: 'fSkillsEngStatus',
  },
  {
    id: 'f_skills_maths',
    header: 'F Skills Maths',
    accessor: (row) => resolveCourseNameField(getNestedValue(row, 'fs_maths')),
  },
  {
    id: 'f_skills_maths_green',
    header: 'F Skills Maths Green',
    accessor: 'fs_maths_green_progress',
    format: 'percent',
  },
  {
    id: 'f_skills_maths_orange',
    header: 'F Skills Maths Orange',
    accessor: 'fs_maths_orange_progress',
    format: 'percent',
  },
  {
    id: 'f_skills_maths_status',
    header: 'F Skills Maths Status',
    accessor: 'fSkillsMathsStatus',
  },
  {
    id: 'supplementary_training_status',
    header: 'Supplementary Training Status',
    accessor: 'supplementary_training_status',
  },
  {
    id: 'supplementary_training_status_green',
    header: 'Supplementary Training Status Green',
    accessor: 'supplementary_training_status_green',
    format: 'percent',
  },
  {
    id: 'supplementary_training_status_orange',
    header: 'Supplementary Training Status Orange',
    accessor: 'supplementary_training_status_orange',
    format: 'percent',
  },
  {
    id: 'last_visit_type',
    header: 'Last Visit type',
    accessor: 'last_visit_type',
  },
  {
    id: 'last_visit_date',
    header: 'Last Visit Date',
    accessor: 'last_visit_date',
    format: 'date',
  },
  {
    id: 'next_visit_type',
    header: 'Next Visit type',
    accessor: 'next_visit_type',
  },
  {
    id: 'next_visit_date',
    header: 'Next Visit Date',
    accessor: 'next_visit_date',
    format: 'date',
  },
  {
    id: 'weeks_since_last_review',
    header: 'Number of week since last review',
    accessor: computeWeeksSinceLastReview,
  },
  {
    id: 'trainer_comment',
    header: 'Trainer Comment',
    accessor: 'comment',
  },
  {
    id: 'learner_type',
    header: 'Learner Type',
    accessor: 'learner_type',
  },
  {
    id: 'last_formal_review',
    header: 'Last Formal Review',
    accessor: 'review_date',
    format: 'date',
  },
  {
    id: 'otj_hours_required',
    header: 'Off the Job Hours Required',
    accessor: (row) => computeOtjMetrics(row).otjRequired,
    format: 'number',
  },
  {
    id: 'otj_hours_required_to_date',
    header: 'Off the Job Hours Required to Date',
    accessor: (row) => computeOtjMetrics(row).requiredToDate,
    format: 'number',
  },
  {
    id: 'actual_otj_hours_recorded',
    header: 'Actual Off the Job Hours Recorded',
    accessor: (row) => computeOtjMetrics(row).totalLoggedHours,
    format: 'number',
  },
  {
    id: 'actual_otj_percent_achieved',
    header: 'Actual Off the Job % Achieved',
    accessor: (row) => computeOtjMetrics(row).otjPercentAchieved,
    format: 'number',
  },
  {
    id: 'actual_otj_differential',
    header: 'Actual OTJ Differential to Date',
    accessor: (row) => computeOtjMetrics(row).otjDifferential,
    format: 'number',
  },
  {
    id: 'last_recorded_otj_entry_date',
    header: 'Last Recorded OTJ Entry Date',
    accessor: (row) => computeOtjMetrics(row).lastEntryDate,
    format: 'datetime',
  },
]
