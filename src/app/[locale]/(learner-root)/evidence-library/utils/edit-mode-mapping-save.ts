/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  AssignmentMappingCreateEntry,
  AssignmentSignoffRequest,
  EvidenceMapping,
} from '@/store/api/evidence/types'
import { COURSE_TYPES } from '../components/constants'

/**
 * Resolve `mapping_id` from GET assignment `mappings[]` using course + unit_code + sub_unit_id,
 * including legacy Standard rows where unit_code is the sub-unit id and sub_unit_id is empty.
 */
export function findMappingIdFromMappings(
  mappings: EvidenceMapping[] | undefined,
  courseId: number,
  unitCode: string,
  subUnitId: string | null,
): number | undefined {
  if (!mappings?.length) return undefined
  const uc = String(unitCode)
  const su =
    subUnitId === null || subUnitId === undefined || subUnitId === ''
      ? null
      : String(subUnitId)

  for (const m of mappings) {
    const mc = (m as { course_id?: number }).course_id ?? m.course?.course_id
    if (Number(mc) !== Number(courseId)) continue
    const muc = String(m.unit_code)
    const msr = m.sub_unit_id
    const msu =
      msr === null || msr === undefined || String(msr) === ''
        ? null
        : String(msr)
    if (muc !== uc) continue
    if (su === null && msu === null) return m.mapping_id
    if (su !== null && msu === su) return m.mapping_id
  }

  if (su !== null) {
    for (const m of mappings) {
      const mc = (m as { course_id?: number }).course_id ?? m.course?.course_id
      if (Number(mc) !== Number(courseId)) continue
      const msr = m.sub_unit_id
      const msuEmpty =
        msr === null || msr === undefined || String(msr) === ''
      if (msuEmpty && String(m.unit_code) === su) return m.mapping_id
    }
  }
  return undefined
}

/**
 * Qualification row from GET: either legacy (`unit_code` = topic id) or new (`unit_code` = parent unit,
 * `topic_id` + optional `sub_unit_id`).
 */
export function findQualificationTopicMappingId(
  mappings: EvidenceMapping[] | undefined,
  courseId: number,
  topicId: string | number,
  subUnitId: string | number,
  parentUnitId?: string | number,
): number | undefined {
  const tid = String(topicId)
  const sid = String(subUnitId)
  const pid =
    parentUnitId === undefined || parentUnitId === null
      ? null
      : String(parentUnitId)

  if (mappings?.length) {
    for (const m of mappings) {
      const mc = (m as { course_id?: number }).course_id ?? m.course?.course_id
      if (Number(mc) !== Number(courseId)) continue
      const rawTopicId = (m as { topic_id?: unknown }).topic_id
      if (rawTopicId == null || String(rawTopicId).trim() === '') continue
      if (String(rawTopicId) !== tid) continue
      if (pid !== null && String(m.unit_code) !== pid) continue
      const msr = m.sub_unit_id
      if (msr != null && String(msr) !== '' && String(msr) !== sid) continue
      return m.mapping_id
    }
  }

  return (
    findMappingIdFromMappings(mappings, courseId, tid, null) ??
    findMappingIdFromMappings(mappings, courseId, tid, sid) ??
    (() => {
      if (!mappings?.length) return undefined
      for (const m of mappings) {
        const mc = (m as { course_id?: number }).course_id ?? m.course?.course_id
        if (Number(mc) !== Number(courseId)) continue
        if (String(m.unit_code) === tid) return m.mapping_id
      }
      return undefined
    })()
  )
}

export type EditUpsertMappingPayload = Record<string, unknown> & {
  assignment_id: number
  course_id: number
  unit_code: string
  sub_unit_ids?: string[]
  mappings?: AssignmentMappingCreateEntry[]
  mapped_by?: 'Learner' | 'Trainer'
}

export type EditMappingSaveOps = {
  upserts: EditUpsertMappingPayload[]
  signoffs: AssignmentSignoffRequest[]
}

/**
 * Build POST `/assignment/mapping` bodies (new PCs) and PATCH `/assignment/signoff` bodies (existing rows)
 * for evidence edit save.
 */
export function collectEditModeMappingSaveOps(options: {
  assignmentId: number
  formUnits: any[]
  selectedCourses: any[]
  mappingsFromApi?: EvidenceMapping[]
  mappedBy?: 'Learner' | 'Trainer'
}): EditMappingSaveOps {
  const {
    assignmentId,
    formUnits,
    selectedCourses,
    mappingsFromApi,
    mappedBy = 'Learner',
  } = options
  const upserts: EditUpsertMappingPayload[] = []
  const signoffs: AssignmentSignoffRequest[] = []
  const maps = mappingsFromApi ?? []

  for (const unit of formUnits) {
    const courseId = Number(unit.course_id)
    const course = selectedCourses.find((c: any) => c.course_id === courseId)
    const isQualification =
      course?.course_core_type === COURSE_TYPES.QUALIFICATION
    const hasSubUnit = unit.subUnit && unit.subUnit.length > 0

    if (isQualification && hasSubUnit) {
      const mappingsToCreate: AssignmentMappingCreateEntry[] = []
      let anyTrainerMap = false
      let anySignedOff = false
      let commentPick =
        unit.comment != null && String(unit.comment).trim() !== ''
          ? String(unit.comment)
          : ''

      for (const subUnit of unit.subUnit ?? []) {
        for (const topic of subUnit.topics ?? []) {
          if (topic.learnerMap !== true) continue
          const mappingId =
            topic.mapping_id ??
            findQualificationTopicMappingId(
              maps,
              courseId,
              topic.id,
              subUnit.id,
              unit.id,
            )
          if (mappingId != null) {
            signoffs.push({
              mapping_id: mappingId,
              learnerMap: true,
              trainerMap: Boolean(topic.trainerMap),
              comment: topic.comment ?? '',
              signed_off: Boolean(topic.signed_off),
              topic_id:
                topic.code != null && topic.code !== ''
                  ? String(topic.code)
                  : String(topic.id),
            })
          } else {
            mappingsToCreate.push({
              sub_unit_id: String(subUnit.id),
              topic_id: String(topic.id),
            })
            if (topic.trainerMap) anyTrainerMap = true
            if (topic.signed_off) anySignedOff = true
            if (
              !commentPick &&
              topic.comment != null &&
              String(topic.comment).trim() !== ''
            ) {
              commentPick = String(topic.comment)
            }
          }
        }
      }

      if (mappingsToCreate.length > 0) {
        upserts.push({
          assignment_id: assignmentId,
          course_id: courseId,
          unit_code: String(unit.id),
          mapped_by: mappedBy,
          learnerMap: true,
          trainerMap: anyTrainerMap,
          comment: commentPick || '',
          signed_off: anySignedOff,
          mappings: mappingsToCreate,
        })
      }
      continue
    }

    if (hasSubUnit) {
      for (const sub of unit.subUnit ?? []) {
        if (sub.learnerMap !== true) continue
        const mappingId =
          sub.mapping_id ??
          findMappingIdFromMappings(
            maps,
            courseId,
            String(unit.id),
            String(sub.id),
          ) ??
          findMappingIdFromMappings(maps, courseId, String(sub.id), null)

        if (mappingId != null) {
          signoffs.push({
            mapping_id: mappingId,
            learnerMap: true,
            trainerMap: Boolean(sub.trainerMap),
            comment: sub.comment ?? '',
            signed_off: Boolean(sub.signed_off),
          })
        } else {
          upserts.push({
            assignment_id: assignmentId,
            course_id: courseId,
            unit_code: String(unit.id),
            sub_unit_ids: [String(sub.id)],
            learnerMap: true,
            trainerMap: Boolean(sub.trainerMap),
            comment: sub.comment ?? '',
            signed_off: Boolean(sub.signed_off),
            mapped_by: mappedBy,
          })
        }
      }
      continue
    }

    if (unit.learnerMap === true) {
      const mappingId =
        unit.mapping_id ??
        findMappingIdFromMappings(maps, courseId, String(unit.id), null)
      if (mappingId != null) {
        signoffs.push({
          mapping_id: mappingId,
          learnerMap: true,
          trainerMap: Boolean(unit.trainerMap),
          comment: unit.comment ?? '',
          signed_off: Boolean(unit.signed_off),
        })
      } else {
        upserts.push({
          assignment_id: assignmentId,
          course_id: courseId,
          unit_code: String(unit.id),
          learnerMap: true,
          trainerMap: Boolean(unit.trainerMap),
          comment: unit.comment ?? '',
          signed_off: Boolean(unit.signed_off),
          mapped_by: mappedBy,
        })
      }
    }
  }

  return { upserts, signoffs }
}

/** Mapping IDs for learner-mapped PCs that already exist (orphan deletion). */
export function collectWantedExistingMappingIds(
  ops: EditMappingSaveOps,
): Set<number> {
  return new Set(ops.signoffs.map((s) => s.mapping_id))
}

/** Normalise RTK `upsertMapping` unwrap result to a single `mapping_id`. */
export function extractMappingIdFromUpsertResponse(
  result: unknown,
  fallbackId?: number | null,
): number | null {
  const r = result as {
    data?: Array<{ mapping_id?: number }> | { mapping_id?: number }
    mapping_id?: number
    id?: number
  }
  if (r?.data && Array.isArray(r.data) && r.data.length > 0) {
    return r.data[0]?.mapping_id ?? null
  }
  if (r?.mapping_id) return r.mapping_id
  if (r?.id) return r.id
  if (r?.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const d = r.data as { mapping_id?: number }
    if (d?.mapping_id) return d.mapping_id
  }
  if (fallbackId != null && fallbackId !== undefined) return fallbackId
  return null
}

/** Collect every `mapping_id` from a batch POST (array `data`) or a single-object response. */
export function extractMappingIdsFromUpsertResponse(result: unknown): number[] {
  const r = result as {
    data?: Array<{ mapping_id?: number }> | { mapping_id?: number }
    mapping_id?: number
    id?: number
  }
  if (r?.data && Array.isArray(r.data)) {
    return r.data
      .map((x) => x?.mapping_id)
      .filter((id): id is number => id != null && typeof id === 'number')
  }
  if (r?.data && typeof r.data === 'object' && !Array.isArray(r.data)) {
    const id = (r.data as { mapping_id?: number }).mapping_id
    return id != null ? [id] : []
  }
  if (r?.mapping_id != null) return [r.mapping_id]
  if (r?.id != null) return [r.id]
  return []
}
