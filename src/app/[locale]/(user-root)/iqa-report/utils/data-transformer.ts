import type { SamplePlanLearner, SamplePlanLearnerUnit } from "@/store/api/qa-sample-plan/types";
import type { ModalFormData } from "@/app/[locale]/(admin-root)/qa-sample-plan/components/edit-sample-modal/types";
import { assessmentMethods } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";

/**
 * Transform sample_history item to ModalFormData format
 */
export function transformSampleHistoryToModalData(
  sampleHistoryItem: Record<string, unknown>
): ModalFormData {
  // Extract assessment methods - handle object format { "WO": true, "WP": false }
  let assessmentMethodsArray: string[] = [];
  if (sampleHistoryItem.assessment_methods && typeof sampleHistoryItem.assessment_methods === "object") {
    assessmentMethodsArray = Object.entries(sampleHistoryItem.assessment_methods)
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  }

  // Extract IQA conclusion - handle object format
  let iqaConclusionArray: string[] = [];
  if (sampleHistoryItem.iqa_conclusion && typeof sampleHistoryItem.iqa_conclusion === "object") {
    iqaConclusionArray = Object.entries(sampleHistoryItem.iqa_conclusion)
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  }

  // Handle assessor decision correct
  let assessorDecisionCorrect = "";
  if (sampleHistoryItem.assessor_decision_correct !== undefined && sampleHistoryItem.assessor_decision_correct !== null) {
    if (typeof sampleHistoryItem.assessor_decision_correct === "boolean") {
      assessorDecisionCorrect = sampleHistoryItem.assessor_decision_correct ? "Yes" : "No";
    } else {
      assessorDecisionCorrect = String(sampleHistoryItem.assessor_decision_correct);
    }
  }

  return {
    qaName: (sampleHistoryItem.assessor_name as string) || "",
    plannedDate: (sampleHistoryItem.planned_date as string) || "",
    assessmentMethods: assessmentMethodsArray,
    assessmentProcesses: (sampleHistoryItem.assessment_processes as string) || "",
    feedback: (sampleHistoryItem.feedback as string) || "",
    type: (sampleHistoryItem.type as string) || "",
    completedDate: (sampleHistoryItem.completed_date as string) || "",
    sampleType: (sampleHistoryItem.sample_type as string) || "",
    iqaConclusion: iqaConclusionArray,
    assessorDecisionCorrect,
  };
}

/**
 * Extract planned dates from sample_history array for tabs
 */
export function extractPlannedDatesFromSampleHistory(
  sampleHistory?: Array<{ planned_date?: string; plannedDate?: string }>
): string[] {
  if (!Array.isArray(sampleHistory)) {
    return [];
  }

  const dates = sampleHistory
    .map((item) => item.planned_date || item.plannedDate)
    .filter((date): date is string => Boolean(date && date.trim()));

  // Remove duplicates and sort
  return Array.from(new Set(dates)).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
}

/**
 * Get empty ModalFormData with default values
 */
export function getEmptyModalFormData(): ModalFormData {
  return {
    qaName: "",
    plannedDate: "",
    assessmentMethods: [],
    assessmentProcesses: "",
    feedback: "",
    type: "",
    completedDate: "",
    sampleType: "",
    iqaConclusion: [],
    assessorDecisionCorrect: "",
  };
}
