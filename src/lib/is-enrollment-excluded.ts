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
