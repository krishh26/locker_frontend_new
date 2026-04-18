/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
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

export type EditUpsertMappingPayload = Record<string, unknown> & {
  assignment_id: number
  course_id: number
  unit_code: string
  sub_unit_ids?: number[]
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
}): EditMappingSaveOps {
  const { assignmentId, formUnits, selectedCourses, mappingsFromApi } = options
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
      for (const subUnit of unit.subUnit ?? []) {
        for (const topic of subUnit.topics ?? []) {
          if (topic.learnerMap !== true) continue
          const unitCodeForRow = String(topic.id)
          const mappingId =
            topic.mapping_id ??
            findMappingIdFromMappings(maps, courseId, unitCodeForRow, null)
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
            upserts.push({
              assignment_id: assignmentId,
              course_id: courseId,
              unit_code: unitCodeForRow,
              learnerMap: true,
              trainerMap: Boolean(topic.trainerMap),
              comment: topic.comment ?? '',
              signed_off: Boolean(topic.signed_off),
              code: topic.code,
              mapped_by: 'Learner',
            })
          }
        }
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
            sub_unit_ids: [Number(sub.id)],
            learnerMap: true,
            trainerMap: Boolean(sub.trainerMap),
            comment: sub.comment ?? '',
            signed_off: Boolean(sub.signed_off),
            mapped_by: 'Learner',
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
          mapped_by: 'Learner',
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
