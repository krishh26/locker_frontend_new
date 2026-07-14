/**
 * Learner GET may set `is_excluded` on the enrollment and/or nested `course`.
 * When true, omit from overall progress UI (info card, charts).
 */
export function isEnrollmentExcluded(entry: {
  is_excluded?: boolean
  course?: { is_excluded?: boolean }
}): boolean {
  if (entry.is_excluded === true) return true
  if (entry.course?.is_excluded === true) return true
  return false
}

/** Course statuses that count toward Overall Progress. */
const OVERALL_PROGRESS_COURSE_STATUSES = new Set([
  'Awaiting Induction',
  'In Training',
])

/**
 * Enrollment counts in Overall Progress when:
 * - not excluded (`is_excluded`), and
 * - course_status is "Awaiting Induction" or "In Training"
 */
export function isCourseEligibleForOverallProgress(entry: {
  is_excluded?: boolean
  course_status?: string | null
  course?: { is_excluded?: boolean }
}): boolean {
  if (isEnrollmentExcluded(entry)) return false
  const status = typeof entry.course_status === 'string' ? entry.course_status.trim() : ''
  return OVERALL_PROGRESS_COURSE_STATUSES.has(status)
}
