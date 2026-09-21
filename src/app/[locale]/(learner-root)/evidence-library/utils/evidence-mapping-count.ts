import type { EvidenceEntry, EvidenceMapping } from '@/store/api/evidence/types'
import { COURSE_TYPES } from '../components/constants'

function mappingCourseId(m: EvidenceMapping): number | undefined {
  const raw: unknown =
    (m as { course_id?: unknown }).course_id ??
    (m.course as { course_id?: unknown } | undefined)?.course_id
  if (raw === null || raw === undefined) return undefined
  if (typeof raw === 'string' && raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function courseCoreType(m: EvidenceMapping): string | undefined {
  const c = m.course as { course_core_type?: string } | undefined
  return c?.course_core_type
}

function str(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
}

function mappingTopicId(m: EvidenceMapping): string {
  const raw = (m as { topic_id?: unknown }).topic_id
  if (raw === null || raw === undefined) return ''
  const s = str(raw).trim()
  return s
}

/**
 * Whether a single assignment mapping row refers to the same PC cell as the
 * evidence form / mappings table.
 *
 * Standard: `unit_code` (+ optional `sub_unit_id` as topicId).
 * Qualification (new): `unit_code` = unit, `topic_id` = criterion, optional `sub_unit_id` = LO.
 * Qualification (legacy): `unit_code` = topic id.
 */
export function mappingMatchesPcCell(
  m: EvidenceMapping,
  courseId: string | number,
  unitId: string | number,
  topicId?: string | number,
  subUnitId?: string | number,
): boolean {
  const mc = mappingCourseId(m)
  if (mc === undefined || Number(mc) !== Number(courseId)) return false

  const core = courseCoreType(m)
  const uc = m.unit_code != null ? str(m.unit_code) : ''
  const suRaw = m.sub_unit_id as string | number | null | undefined
  const su =
    suRaw !== null && suRaw !== undefined && str(suRaw) !== ''
      ? str(suRaw)
      : ''
  const mTopicId = mappingTopicId(m)
  const hasTopicIdCol = mTopicId !== ''

  const isQualification =
    core === COURSE_TYPES.QUALIFICATION || hasTopicIdCol

  if (isQualification) {
    if (topicId === undefined || topicId === null) return false

    // New API shape: unit_code = unit, topic_id = assessment criterion
    if (hasTopicIdCol) {
      if (mTopicId !== str(topicId)) return false
      if (uc !== str(unitId)) return false
      if (
        su &&
        subUnitId !== undefined &&
        subUnitId !== null &&
        su !== str(subUnitId)
      ) {
        return false
      }
      return true
    }

    // Legacy: unit_code alone held the topic id
    return uc === str(topicId)
  }

  if (topicId !== undefined && topicId !== null) {
    if (uc === str(unitId) && su === str(topicId)) return true
    if (!su && uc === str(topicId)) return true
    return false
  }

  return !su && uc === str(unitId)
}

/** Count how many evidence assignments include at least one mapping for this PC. */
export function countEvidenceSubmissionsForCell(
  entries: EvidenceEntry[],
  courseId: string | number,
  unitId: string | number,
  topicId?: string | number,
  subUnitId?: string | number,
): number {
  let n = 0
  for (const entry of entries) {
    const maps = entry.mappings
    if (!maps?.length) continue
    if (
      maps.some((m) =>
        mappingMatchesPcCell(m, courseId, unitId, topicId, subUnitId),
      )
    ) {
      n += 1
    }
  }
  return n
}
