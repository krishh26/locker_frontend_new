/**
 * Unmapped-evidence rows are a custom API shape (`learner.name`, nested `course`),
 * not a learner/UserCourse entity. Flatten fields so COMMON_REPORT_COLUMNS resolve.
 */
export function normalizeUnmappedEvidenceRows(
  raw: unknown[],
): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const row = item as Record<string, unknown>
    const learner =
      row.learner && typeof row.learner === 'object'
        ? (row.learner as Record<string, unknown>)
        : null
    const course =
      row.course && typeof row.course === 'object'
        ? (row.course as Record<string, unknown>)
        : null

    let firstName =
      (typeof learner?.first_name === 'string' && learner.first_name) ||
      (typeof row.first_name === 'string' && row.first_name) ||
      ''
    let lastName =
      (typeof learner?.last_name === 'string' && learner.last_name) ||
      (typeof row.last_name === 'string' && row.last_name) ||
      ''

    if (!firstName && !lastName && typeof learner?.name === 'string') {
      const parts = learner.name.trim().split(/\s+/).filter(Boolean)
      firstName = parts[0] ?? ''
      lastName = parts.slice(1).join(' ')
    }

    output.push({
      ...row,
      first_name: firstName || null,
      last_name: lastName || null,
      // nested course.name → course.course_name for shared course accessors
      course: course
        ? {
            ...course,
            course_name: course.course_name ?? course.name ?? null,
            course_code: course.course_code ?? course.code ?? null,
            course_id: course.course_id ?? course.id ?? null,
          }
        : row.course,
      course_name:
        row.course_name ??
        course?.course_name ??
        course?.name ??
        null,
    })
  }

  return output
}
