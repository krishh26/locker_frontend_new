import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useLazyGetSamplePlanLearnersQuery, useGetSamplePlansQuery } from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { SamplePlanLearner, SamplePlanLearnerUnit, SamplePlanQueryParams } from "@/store/api/qa-sample-plan/types";

export interface UnitWithHistory extends SamplePlanLearnerUnit {
  sample_history: Array<{
    detail_id?: number;
    planned_date?: string;
    sample_type?: string;
    status?: string;
    [key: string]: unknown;
  }>;
}

export interface UseIVReportDataReturn {
  learners: SamplePlanLearner[];
  units: UnitWithHistory[];
  planId: string | number | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

export function useIVReportData(courseId: string | null): UseIVReportDataReturn {
  const [learners, setLearners] = useState<SamplePlanLearner[]>([]);
  const [planId, setPlanId] = useState<string | number | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.user_id as string | number | undefined;
  const isEqa = user?.role === "EQA";

  // Fetch plans for the course
  const samplePlanQueryArgs = useMemo((): SamplePlanQueryParams | undefined => {
    if (!courseId || !userId) return undefined;
    if (isEqa) {
      return { course_id: courseId, eqaId: userId };
    }
    return { course_id: courseId, iqa_id: userId };
  }, [courseId, userId, isEqa]);

  const {
    data: samplePlanResponse,
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
  } = useGetSamplePlansQuery(
    samplePlanQueryArgs as SamplePlanQueryParams,
    { skip: !samplePlanQueryArgs }
  );

  // Get plan ID from plans response
  useEffect(() => {
    if (!samplePlanResponse) return;

    // New API response structure:
    // {
    //   "message": "Sampling plans fetched successfully",
    //   "data": {
    //     "id": 14,
    //     "planName": "Highfiled",
    //     ...
    //   },
    //   "status": true
    // }
    const responseData = (samplePlanResponse as { data?: unknown })?.data;
    
    if (responseData && typeof responseData === "object") {
      const planData = responseData as Record<string, unknown>;
      // Try to get plan ID from the new structure (data.id)
      const planIdValue = planData.id ?? planData.plan_id ?? planData.planId;
      if (planIdValue) {
        setPlanId(String(planIdValue));
        return;
      }
    }

    // Fallback: Handle old response structure (array or object with plans array)
    const rawPlanDataSource = responseData ?? samplePlanResponse ?? null;
    let rawPlans: Array<Record<string, unknown>> = [];

    if (Array.isArray(rawPlanDataSource)) {
      rawPlans = rawPlanDataSource;
    } else if (rawPlanDataSource && typeof rawPlanDataSource === "object") {
      const plansArray = (rawPlanDataSource as Record<string, unknown>).plans;
      if (Array.isArray(plansArray)) {
        rawPlans = plansArray;
      }
    }

    if (rawPlans.length > 0) {
      const firstPlan = rawPlans[0];
      const planIdValue = firstPlan.plan_id ?? firstPlan.id ?? firstPlan.planId;
      if (planIdValue) {
        setPlanId(String(planIdValue));
      }
    }
  }, [samplePlanResponse]);

  // Fetch learners when planId is available
  const [
    triggerGetLearners,
    {
      data: learnersResponse,
      isFetching: isLearnersFetching,
      isLoading: isLearnersLoading,
      isError: isLearnersError,
      error: learnersError,
    },
  ] = useLazyGetSamplePlanLearnersQuery();

  useEffect(() => {
    if (planId) {
      triggerGetLearners(planId);
    }
  }, [planId, triggerGetLearners]);

  const isLoading = isPlansFetching || isPlansLoading || isLearnersFetching || isLearnersLoading;

  // Transform learners data to extract units
  const units: UnitWithHistory[] = useMemo(() => {
    if (!learners.length) {
      return [];
    }

    // Collect all units from all learners
    const unitsMap = new Map<string | number, UnitWithHistory>();

    learners.forEach((learner) => {
      const learnerUnits = Array.isArray(learner.units) ? learner.units : [];
      learnerUnits.forEach((unit: SamplePlanLearnerUnit) => {
        const unitCode = unit.unit_code || unit.unit_name || "";
        const unitKey = unitCode ? String(unitCode) : "";

        if (unitKey && !unitsMap.has(unitKey)) {
          // Ensure sample_history exists
          const sampleHistory = Array.isArray(unit.sample_history) ? unit.sample_history : [];
          unitsMap.set(unitKey, {
            ...unit,
            sample_history: sampleHistory,
          } as UnitWithHistory);
        }
      });
    });

    return Array.from(unitsMap.values());
  }, [learners]);

  // Update learners when response changes
  useEffect(() => {
    if (!learnersResponse) {
      setLearners([]);
      return;
    }

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
    const responseData = learnersResponse as {
      data?: {
        learners?: SamplePlanLearner[];
        plan_id?: string | number;
      };
    };

    const learnersData: SamplePlanLearner[] =
      Array.isArray(responseData?.data?.learners)
        ? responseData.data.learners
        : [];

    setLearners(learnersData);

    // Also update planId from response if available
    const responsePlanId = responseData?.data?.plan_id;
    if (responsePlanId && !planId) {
      setPlanId(String(responsePlanId));
    }
  }, [learnersResponse, planId]);

  return {
    learners,
    units,
    planId,
    isLoading,
    isError: isLearnersError,
    error: learnersError,
  };
}
