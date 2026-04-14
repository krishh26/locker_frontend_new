import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { qaStatuses } from "../../../utils/constants";

/**
 * Filter learners by QA approval status and optional search text
 */
export function filterVisibleRows(
  learnersData: SamplePlanLearner[],
  searchText: string,
  filterApplied: boolean,
  selectedQaStatus: string
): SamplePlanLearner[] {
  if (!filterApplied) return [];

  const qaApprovedOnlyLabel = qaStatuses[1];
  const afterQaStatus =
    selectedQaStatus === qaApprovedOnlyLabel
      ? learnersData.filter((row) => row.qa_approved === true)
      : learnersData;

  if (!searchText.trim()) return afterQaStatus;

  const lowered = searchText.toLowerCase();
  return afterQaStatus.filter((row) => {
    const assessor = row?.assessor_name?.toLowerCase() ?? "";
    const learner = row?.learner_name?.toLowerCase() ?? "";
    const sampleType = row?.sample_type?.toLowerCase() ?? "";
    const status = row?.status?.toLowerCase() ?? "";
    return (
      assessor.includes(lowered) ||
      learner.includes(lowered) ||
      sampleType.includes(lowered) ||
      status.includes(lowered)
    );
  });
}

/**
 * Check if any learner has a planned date
 */
export function hasPlannedDate(learnersData: SamplePlanLearner[]): boolean {
  return learnersData.some((learner) => {
    if (learner.planned_date != null) return true;
    if (Array.isArray(learner.units)) {
      return learner.units.some((unit: any) => {
        if (Array.isArray(unit?.sample_history)) {
          return unit.sample_history.some(
            (history: any) => history?.planned_date != null
          );
        }
        return false;
      });
    }
    return false;
  });
}
