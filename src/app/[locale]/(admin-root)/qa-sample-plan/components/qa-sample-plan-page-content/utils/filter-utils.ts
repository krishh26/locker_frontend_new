import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";

/**
 * Filter learners based on search text
 */
export function filterVisibleRows(
  learnersData: SamplePlanLearner[],
  searchText: string,
  filterApplied: boolean
): SamplePlanLearner[] {
  if (!filterApplied) return [];
  if (!searchText.trim()) return learnersData;

  const lowered = searchText.toLowerCase();
  return learnersData.filter((row) => {
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
