import type { PlanDetailsResponse } from "@/store/api/qa-sample-plan/types";
import type { ModalFormData } from "../types";
import {
  assessmentMethodsSelectionFromApi,
  buildAssessmentMethodsPayload,
} from "@/config/assessment-methods";

/**
 * Transform PlanDetailsResponse data to ModalFormData format
 */
export function transformPlanDetailsToModalData(
  data: PlanDetailsResponse["data"] | null | undefined
): ModalFormData {
  if (!data) {
    return getEmptyModalFormData();
  }

  const assessmentMethodsArray = assessmentMethodsSelectionFromApi(
    data.assessmentMethods ?? data.assessment_methods,
  );

  // Extract IQA conclusion - handle both array and object formats
  let iqaConclusionArray: string[] = [];
  if (Array.isArray(data.iqaConclusion || data.iqa_conclusion)) {
    iqaConclusionArray = (data.iqaConclusion || data.iqa_conclusion) as string[];
  } else if (data.iqa_conclusion && typeof data.iqa_conclusion === "object") {
    // Convert object format { "Valid": true, "Authentic": false } to array
    iqaConclusionArray = Object.entries(data.iqa_conclusion)
      .filter(([, value]) => value === true)
      .map(([key]) => key);
  }

  // Handle assessor decision correct - convert boolean to "Yes"/"No" string
  let assessorDecisionCorrect = "";
  if (data.assessorDecisionCorrect) {
    assessorDecisionCorrect = data.assessorDecisionCorrect;
  } else if (data.assessor_decision_correct !== undefined && data.assessor_decision_correct !== null) {
    if (typeof data.assessor_decision_correct === "boolean") {
      assessorDecisionCorrect = data.assessor_decision_correct ? "Yes" : "No";
    } else {
      assessorDecisionCorrect = String(data.assessor_decision_correct);
    }
  }

  return {
    qaName: data.qaName || data.assessor_name || "",
    plannedDate: data.plannedDate || data.planned_date || "",
    assessmentMethods: assessmentMethodsArray,
    assessmentProcesses: data.assessmentProcesses || data.assessment_processes || "",
    feedback: data.feedback || "",
    type: data.type || "",
    completedDate: data.completedDate || data.completed_date || "",
    sampleType: data.sampleType || data.sample_type || "",
    iqaConclusion: iqaConclusionArray,
    assessorDecisionCorrect,
  };
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

/**
 * Extract planned dates from sampled learners array for tabs
 */
export function extractPlannedDates(
  sampledLearners?: Array<{ planned_date?: string; plannedDate?: string }>
): string[] {
  if (!Array.isArray(sampledLearners)) {
    return [];
  }

  const dates = sampledLearners
    .map((learner) => learner.planned_date || learner.plannedDate)
    .filter((date): date is string => Boolean(date && date.trim()));

  // Remove duplicates
  return Array.from(new Set(dates));
}

/**
 * Convert ModalFormData to UpdateSamplePlanDetailRequest format
 */
export function transformModalDataToUpdateRequest(
  modalData: ModalFormData,
  planId: string | number
): {
  plan_id: string | number;
  completedDate?: string;
  feedback?: string;
  status?: string;
  assessment_methods?: Record<string, boolean>;
  iqa_conclusion?: Record<string, boolean>;
  assessor_decision_correct?: boolean;
  sample_type?: string;
  plannedDate?: string;
  type?: string;
} {
  const assessmentMethodsObj = buildAssessmentMethodsPayload(
    modalData.assessmentMethods,
  );

  // Convert IQA conclusion array to object format
  const iqaConclusionObj: Record<string, boolean> = {};
  const iqaConclusionOptions = ["Valid", "Authentic", "Sufficient", "Relevant", "Current"];
  iqaConclusionOptions.forEach((option) => {
    iqaConclusionObj[option] = modalData.iqaConclusion.includes(option);
  });

  // Convert assessor decision correct string to boolean
  let assessorDecisionCorrect: boolean | undefined;
  if (modalData.assessorDecisionCorrect === "Yes") {
    assessorDecisionCorrect = true;
  } else if (modalData.assessorDecisionCorrect === "No") {
    assessorDecisionCorrect = false;
  }

  return {
    plan_id: planId,
    completedDate: modalData.completedDate || undefined,
    feedback: modalData.feedback || undefined,
    assessment_methods: assessmentMethodsObj,
    iqa_conclusion: iqaConclusionObj,
    assessor_decision_correct: assessorDecisionCorrect,
    sample_type: modalData.sampleType || undefined,
    plannedDate: modalData.plannedDate || undefined,
    type: modalData.type || undefined,
  };
}

