import { useState, useCallback } from 'react'
import type { EvidenceItem } from '@/store/api/qa-sample-plan/types'
import { useLazyGetEvidenceListQuery } from '@/store/api/qa-sample-plan/qaSamplePlanApi'

export function useEvidenceList(planDetailId: string | number | null, unitCode: string | null) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([])
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false)

  const [triggerGetEvidence] = useLazyGetEvidenceListQuery()

  const fetchEvidence = useCallback(async () => {
    if (!planDetailId || !unitCode) return
    setIsLoadingEvidence(true)
    try {
      const res = await triggerGetEvidence({
        planDetailId,
        unitCode: String(unitCode),
      }).unwrap()
      setEvidenceList((res as { data?: EvidenceItem[] })?.data || [])
    } catch {
      setEvidenceList([])
    } finally {
      setIsLoadingEvidence(false)
    }
  }, [planDetailId, unitCode, triggerGetEvidence])

  return {
    evidenceList,
    isLoadingEvidence,
    fetchEvidence,
  }
}

