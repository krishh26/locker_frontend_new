import { useCallback, useMemo } from 'react'
import { useGetEvidenceListQuery } from '@/store/api/evidence/evidenceApi'
import type { EvidenceEntry } from '@/store/api/evidence/types'
import { countEvidenceSubmissionsForCell } from '../utils/evidence-mapping-count'

const LIST_LIMIT = 2000

/**
 * Loads the learner's evidence list (with mappings) and exposes getEvidenceCount(courseId, unitId, topicId?)
 * for PC cells. Capped at LIST_LIMIT newest assignments; counts may be incomplete if the learner has more.
 */
export function useEvidenceSubmissionCounts(
  ownerUserId: string | number | null | undefined,
) {
  const uid =
    ownerUserId !== null && ownerUserId !== undefined && ownerUserId !== ''
      ? String(ownerUserId)
      : undefined

  const { data, isLoading, isFetching } = useGetEvidenceListQuery(
    { user_id: uid, page: 1, limit: LIST_LIMIT },
    { skip: !uid },
  )

  const entries = useMemo(
    () => (Array.isArray(data?.data) ? (data!.data as EvidenceEntry[]) : []),
    [data?.data],
  )

  const getEvidenceCount = useCallback(
    (courseId: string | number, unitId: string | number, topicId?: string | number) =>
      countEvidenceSubmissionsForCell(entries, courseId, unitId, topicId),
    [entries],
  )

  return {
    getEvidenceCount,
    isLoading: Boolean(uid) && (isLoading || isFetching),
    entries,
  }
}
