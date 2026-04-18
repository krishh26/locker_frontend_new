import type { EvidenceEntry, EvidenceMapping } from '@/store/api/evidence/types'
import { COURSE_TYPES } from '../components/constants'

function mappingCourseId(m: EvidenceMapping): number | undefined {
  const raw = (m as { course_id?: number }).course_id ?? m.course?.course_id
  if (raw === null || raw === undefined || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function courseCoreType(m: EvidenceMapping): string | undefined {
  const c = m.course as { course_core_type?: string } | undefined
  return c?.course_core_type
}

/**
 * Whether a single assignment mapping row refers to the same PC cell as the
 * evidence form / mappings table (Standard: unit + optional sub-unit; Qualification: topic id in unit_code).
 */
export function mappingMatchesPcCell(
  m: EvidenceMapping,
  courseId: string | number,
  unitId: string | number,
  topicId?: string | number,
): boolean {
  const mc = mappingCourseId(m)
  if (mc === undefined || Number(mc) !== Number(courseId)) return false

  const core = courseCoreType(m)
  const uc = m.unit_code != null ? String(m.unit_code) : ''
  const suRaw = m.sub_unit_id as string | number | null | undefined
  const su =
    suRaw !== null && suRaw !== undefined && String(suRaw) !== ''
      ? String(suRaw)
      : ''

  if (core === COURSE_TYPES.QUALIFICATION) {
    if (topicId === undefined || topicId === null) return false
    return uc === String(topicId)
  }

  if (topicId !== undefined && topicId !== null) {
    if (uc === String(unitId) && su === String(topicId)) return true
    if (!su && uc === String(topicId)) return true
    return false
  }

  return !su && uc === String(unitId)
}

/** Count how many evidence assignments include at least one mapping for this PC. */
export function countEvidenceSubmissionsForCell(
  entries: EvidenceEntry[],
  courseId: string | number,
  unitId: string | number,
  topicId?: string | number,
): number {
  let n = 0
  for (const entry of entries) {
    const maps = entry.mappings
    if (!maps?.length) continue
    if (maps.some((m) => mappingMatchesPcCell(m, courseId, unitId, topicId))) n += 1
  }
  return n
}
