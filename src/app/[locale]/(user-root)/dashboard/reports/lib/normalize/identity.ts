/** Pass-through normalizer for already learner/UserCourse-shaped rows. */
export function normalizeIdentityRows(
  raw: unknown[],
): Record<string, unknown>[] {
  return raw.filter(
    (row): row is Record<string, unknown> =>
      row != null && typeof row === 'object' && !Array.isArray(row),
  )
}
