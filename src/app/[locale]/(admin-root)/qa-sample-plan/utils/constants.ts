import {
  toQaAssessmentMethodList,
  type AssessmentMethodCode,
} from "@/config/assessment-methods";

export {
  assessmentMethods,
  assessmentMethodCodes,
  assessmentMethodCodesForPayload,
  getAssessmentMethodByCode,
  getAssessmentMethodById,
  toQaAssessmentMethodList,
  type AssessmentMethod,
} from "@/config/assessment-methods";

/** QA list with titles — use `getQaAssessmentMethods(t)` in UI for i18n titles. */
export function getQaAssessmentMethods(
  getTitle: (code: string) => string,
) {
  return toQaAssessmentMethodList((code: AssessmentMethodCode) =>
    getTitle(code),
  );
}

export interface SampleType {
  value: string;
  label: string;
}

export const qaStatuses = ["All", "QA Approved"];

export const sampleTypes: SampleType[] = [
  { value: "Portfolio", label: "Sample Portfolio" },
  { value: "ObserveAssessor", label: "Observe Assessor" },
  { value: "LearnerInterview", label: "Learner Interview" },
  { value: "EmployerInterview", label: "Employer Interview" },
  { value: "Final", label: "Final Check" },
];

export const modalSampleTypes = [
  "Learner interview",
  "Observation",
  "Portfolio review",
  "Assessment review",
];

export const iqaConclusionOptions = ["Valid", "Authentic", "Sufficient", "Relevant", "Current"];

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

export const getTabColor = (index: number): string => {
  return index % 2 === 0 ? "primary" : "#e91e63";
};
