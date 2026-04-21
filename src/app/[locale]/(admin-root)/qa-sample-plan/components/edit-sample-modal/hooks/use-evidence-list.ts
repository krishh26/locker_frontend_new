import { useState, useCallback } from "react";
import type { EvidenceItem } from "@/store/api/qa-sample-plan/types";
import { useLazyGetEvidenceListQuery } from "@/store/api/qa-sample-plan/qaSamplePlanApi";

export function useEvidenceList(planDetailId: string | number | null, unitCode: string | null) {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isEvidenceError, setIsEvidenceError] = useState(false);
  const [evidenceErrorMessage, setEvidenceErrorMessage] = useState<string | null>(null);

  const [triggerGetEvidence] = useLazyGetEvidenceListQuery();

  const fetchEvidence = useCallback(async () => {
    if (!planDetailId || !unitCode) return;
    setIsLoadingEvidence(true);
    setIsEvidenceError(false);
    setEvidenceErrorMessage(null);
    try {
      const res = await triggerGetEvidence({
        planDetailId,
        unitCode: String(unitCode),
      }).unwrap();
      setEvidenceList((res as { data?: EvidenceItem[] })?.data || []);
    } catch (err: unknown) {
      setEvidenceList([]);
      setIsEvidenceError(true);
      let message = "Failed to load evidence list.";
      if (err && typeof err === "object") {
        if ("data" in err && err.data && typeof err.data === "object" && "message" in err.data) {
          const m = (err.data as { message?: string }).message;
          if (typeof m === "string" && m) message = m;
        } else if ("message" in err && typeof (err as Error).message === "string") {
          message = (err as Error).message;
        }
      }
      setEvidenceErrorMessage(message);
    } finally {
      setIsLoadingEvidence(false);
    }
  }, [planDetailId, unitCode, triggerGetEvidence]);

  return {
    evidenceList,
    isLoadingEvidence,
    isEvidenceError,
    evidenceErrorMessage,
    fetchEvidence,
  };
}

