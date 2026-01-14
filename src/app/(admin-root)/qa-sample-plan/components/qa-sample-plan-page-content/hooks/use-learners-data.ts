import { useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import { useLazyGetSamplePlanLearnersQuery } from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { setPlanSummary, setFilterError } from "@/store/slices/qaSamplePlanSlice";
import { filterVisibleRows, hasPlannedDate } from "../utils/filter-utils";
import type { PlanSummary } from "@/store/slices/qaSamplePlanSlice";

export interface UseLearnersDataReturn {
  learnersData: SamplePlanLearner[];
  visibleRows: SamplePlanLearner[];
  isLearnersInFlight: boolean;
  isLearnersError: boolean;
  learnersError: any;
  planSummary: PlanSummary | undefined;
  hasPlannedDate: boolean;
  triggerSamplePlanLearners: (planId: string) => void;
  searchText: string;
  filterApplied: boolean;
}

export function useLearnersData(
  selectedPlan: string,
  filterApplied: boolean,
  searchText: string
): UseLearnersDataReturn {
  const dispatch = useAppDispatch();

  // Fetch learners (lazy query)
  // Note: RTK Query shares cache between hook instances, so multiple components
  // calling this hook will see the same data once the query is triggered
  const [
    triggerSamplePlanLearners,
    {
      data: learnersResponse,
      isFetching: isLearnersFetching,
      isLoading: isLearnersLoading,
      isError: isLearnersError,
      error: learnersError,
    },
  ] = useLazyGetSamplePlanLearnersQuery();

  const isLearnersInFlight = isLearnersFetching || isLearnersLoading;

  // Transform learners data
  const learnersData: SamplePlanLearner[] = useMemo(() => {
    if (!learnersResponse) return [];

    // API response structure: 
    // {
    //   "message": "Learners fetched successfully",
    //   "status": true,
    //   "data": {
    //     "plan_id": "14",
    //     "course_name": "Highfiled",
    //     "learners": [...]
    //   }
    // }
    // RTK Query returns the response as-is after transformResponse
    const learners: SamplePlanLearner[] = 
      Array.isArray((learnersResponse as any)?.data?.learners)
        ? ((learnersResponse as any).data.learners as SamplePlanLearner[])
        : [];

    if (!learners.length) return [];

    // Deduplicate units by unit_code
    return learners
      .filter(Boolean)
      .map((learner) => {
        const learnerUnits = Array.isArray(learner.units) ? learner.units : [];
        const learnerUnitsMap = new Map<string, any>();
        learnerUnits.forEach((unit: any) => {
          // Convert unit_code to string for consistent key handling
          const unitCode = unit?.unit_code != null ? String(unit.unit_code) : unit?.unit_name || "";
          if (unitCode && !learnerUnitsMap.has(unitCode)) {
            learnerUnitsMap.set(unitCode, unit);
          }
        });
        const deduplicatedUnits = Array.from(learnerUnitsMap.values());
        return { ...learner, units: deduplicatedUnits };
      });
  }, [learnersResponse]);

  // Update plan summary in Redux
  useEffect(() => {
    if (!learnersResponse || isLearnersInFlight) return;

    const responseData = (learnersResponse as any)?.data ?? learnersResponse;
    if (responseData && typeof responseData === "object" && !Array.isArray(responseData)) {
      const planIdValue = responseData?.plan_id ?? responseData?.planId ?? responseData?.id ?? selectedPlan;
      const courseNameValue = responseData?.course_name ?? responseData?.courseName ?? responseData?.name ?? "";
      dispatch(setPlanSummary({
        planId: planIdValue !== undefined && planIdValue !== null ? String(planIdValue) : selectedPlan || undefined,
        courseName: courseNameValue ? String(courseNameValue) : undefined,
      }));
    } else if (filterApplied) {
      dispatch(setPlanSummary({
        planId: selectedPlan || undefined,
        courseName: undefined,
      }));
    }
  }, [learnersResponse, isLearnersInFlight, filterApplied, selectedPlan, dispatch]);

  // Filter visible rows
  const visibleRows = useMemo(() => {
    return filterVisibleRows(learnersData, searchText, filterApplied);
  }, [filterApplied, learnersData, searchText]);

  // Check if planned date exists
  const hasPlannedDateValue = useMemo(() => {
    return hasPlannedDate(learnersData);
  }, [learnersData]);

  // Get planSummary from Redux (we'll access it via selector in components)
  const planSummary: PlanSummary | undefined = undefined; // Will be accessed via Redux selector

  // Ensure we return stable references
  return {
    learnersData,
    visibleRows, // This should be the filtered array
    isLearnersInFlight,
    isLearnersError,
    learnersError,
    planSummary,
    hasPlannedDate: hasPlannedDateValue,
    triggerSamplePlanLearners,
    searchText,
    filterApplied,
  };
}
