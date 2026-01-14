"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  useGetCoursesQuery,
} from "@/store/api/course/courseApi";
import {
  useGetSamplePlansQuery,
  useLazyGetSamplePlanLearnersQuery,
  useApplySamplePlanLearnersMutation,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { LearnersTable } from "../learners-table";
import { FilterPanel } from "../filter-panel";
import { QASamplePlanLayout } from "./components/qa-sample-plan-layout";
import { useLearnersData } from "./hooks/use-learners-data";
import { buildApplySamplesPayload } from "./utils/apply-samples-payload";
import { toast } from "sonner";
import {
  selectQASamplePlanState,
  selectSelectedCourse,
  selectSelectedPlan,
  selectPlans,
  selectFilterState,
  selectUnitSelection,
  setSelectedCourse,
  setSelectedPlan,
  setPlans,
  setFilterApplied,
  setFilterError,
  setPlanSummary,
  toggleUnitForLearner,
  resetSelectedUnits,
} from "@/store/slices/qaSamplePlanSlice";
import type { Plan } from "@/store/slices/qaSamplePlanSlice";

export function QASamplePlanPageContent() {
  const dispatch = useAppDispatch();
  
  // Get current user
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id as string | number | undefined;

  // Redux state
  const qaState = useAppSelector(selectQASamplePlanState);
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const selectedPlan = useAppSelector(selectSelectedPlan);
  const plans = useAppSelector(selectPlans);
  const filterState = useAppSelector(selectFilterState);
  const unitSelection = useAppSelector(selectUnitSelection);

  // RTK Query - Courses
  const { data: coursesData, isLoading: coursesLoading } = useGetCoursesQuery(
    { page: 1, page_size: 500 },
    { skip: false }
  );

  const courses = useMemo(() => {
    if (!coursesData?.data) return [];
    return coursesData.data.map((course) => ({
      id: course.course_id.toString(),
      name: course.course_name || "Untitled Course",
    }));
  }, [coursesData]);

  // RTK Query - Plans (conditional)
  const samplePlanQueryArgs = useMemo(() => {
    if (!selectedCourse || !iqaId) return undefined;
    return { course_id: selectedCourse, iqa_id: iqaId };
  }, [selectedCourse, iqaId]);

  const {
    data: samplePlanResponse,
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = useGetSamplePlansQuery(
    samplePlanQueryArgs as { course_id: string; iqa_id: number },
    { skip: !samplePlanQueryArgs }
  );

  const isPlanListLoading = isPlansFetching || isPlansLoading;

  // Normalize and store plans in Redux
  useEffect(() => {
    if (!selectedCourse) {
      dispatch(setPlans([]));
      dispatch(setSelectedPlan(""));
      return;
    }

    if (isPlanListLoading) return;

    if (isPlansError) {
      dispatch(setPlans([]));
      dispatch(setSelectedPlan(""));
      return;
    }

    const rawPlanDataSource = (samplePlanResponse as any)?.data ?? samplePlanResponse ?? null;
    let rawPlans: Array<Record<string, any>> = [];

    if (Array.isArray(rawPlanDataSource)) {
      rawPlans = rawPlanDataSource;
    } else if (rawPlanDataSource && typeof rawPlanDataSource === "object" && Object.keys(rawPlanDataSource).length > 0) {
      rawPlans = [rawPlanDataSource];
    } else if (Array.isArray((samplePlanResponse as any)?.data?.data)) {
      rawPlans = (samplePlanResponse as any).data.data ?? [];
    }

    if (rawPlans.length) {
      const normalizedPlans: Plan[] = rawPlans
        .map((plan: Record<string, any>) => {
          const idCandidate = plan?.plan_id ?? plan?.planId ?? plan?.id ?? plan?.sample_plan_id ?? "";
          const nameCandidate = plan?.plan_name ?? plan?.planName ?? plan?.sample_plan_name ?? plan?.title ?? plan?.name ?? "";
          const id = idCandidate !== null && idCandidate !== undefined ? String(idCandidate) : "";
          const label = nameCandidate ? String(nameCandidate) : id ? `Plan ${id}` : "";
          return { id, label };
        })
        .filter((plan) => plan.id);

      const uniquePlans = Array.from(new Map(normalizedPlans.map((plan) => [plan.id, plan])).values());
      dispatch(setPlans(uniquePlans));

      if (!uniquePlans.some((plan) => plan.id === selectedPlan)) {
        dispatch(setSelectedPlan(""));
      }
      return;
    }

    dispatch(setPlans([]));
    dispatch(setSelectedPlan(""));
  }, [isPlanListLoading, isPlansError, samplePlanResponse, selectedCourse, selectedPlan, dispatch]);

  // Plan placeholder text
  const planPlaceholderText = useMemo(() => {
    if (!selectedCourse) return "Select a course first";
    if (isPlanListLoading) return "Loading plans...";
    if (isPlansError) return "Unable to load plans";
    if (!plans.length) return "No plans available";
    return "Select a plan";
  }, [isPlanListLoading, isPlansError, plans.length, selectedCourse]);

  // Learners data hook (keeps API logic, dispatches Redux actions)
  const learnersData = useLearnersData(
    selectedPlan,
    filterState.filterApplied,
    filterState.searchText
  );

  // Apply samples mutation
  const [applySamplePlanLearners, { isLoading: isApplySamplesLoading }] = useApplySamplePlanLearnersMutation();

  // Handle learners error
  useEffect(() => {
    if (learnersData.isLearnersError && learnersData.learnersError) {
      const apiError = learnersData.learnersError as any;
      const message = apiError?.data?.message || apiError?.error || "Failed to fetch learners for the selected plan.";
      dispatch(setFilterError(message));
    }
  }, [learnersData.isLearnersError, learnersData.learnersError, dispatch]);

  // Reset selected units when learners data changes
  useEffect(() => {
    if (learnersData.learnersData.length > 0) {
      dispatch(resetSelectedUnits());
    }
  }, [learnersData.learnersData.length, dispatch]);

  // Computed values
  const courseName = useMemo(() => {
    if (qaState.planSummary?.courseName) return qaState.planSummary.courseName;
    if (selectedCourse) {
      const course = courses.find((c) => c.id === selectedCourse);
      return course?.name || "";
    }
    return "";
  }, [qaState.planSummary, selectedCourse, courses]);

  const isApplySamplesDisabled = useMemo(() => {
    return (
      !filterState.filterApplied ||
      !selectedPlan ||
      !filterState.sampleType ||
      !learnersData.learnersData.length ||
      isPlanListLoading ||
      learnersData.isLearnersInFlight ||
      isApplySamplesLoading
    );
  }, [
    filterState.filterApplied,
    selectedPlan,
    filterState.sampleType,
    learnersData.learnersData.length,
    isPlanListLoading,
    learnersData.isLearnersInFlight,
    isApplySamplesLoading,
  ]);

  // Handlers
  const handleCourseChange = useCallback(
    (courseId: string) => {
      dispatch(setSelectedCourse(courseId));
    },
    [dispatch]
  );

  const handlePlanChange = useCallback(
    (planId: string) => {
      dispatch(setSelectedPlan(planId));
    },
    [dispatch]
  );

  const handleApplyFilter = useCallback(() => {
    if (!selectedCourse) {
      dispatch(setFilterError("Please select a course before filtering."));
      dispatch(setFilterApplied(false));
      return;
    }

    if (!plans.length) {
      dispatch(setFilterError("No QA plans are available for the selected course."));
      dispatch(setFilterApplied(false));
      return;
    }

    if (!selectedPlan || !plans.some((plan) => plan.id === selectedPlan)) {
      dispatch(setFilterError("Please select both a course and a plan before filtering."));
      dispatch(setFilterApplied(false));
      return;
    }

    dispatch(setFilterError(""));
    dispatch(setFilterApplied(true));
    learnersData.triggerSamplePlanLearners(selectedPlan);
  }, [selectedCourse, plans, selectedPlan, dispatch, learnersData]);

  const handleApplySamples = useCallback(async () => {
    if (!selectedPlan) {
      dispatch(setFilterError("Please select a plan before applying samples."));
      return;
    }

    if (!filterState.sampleType) {
      dispatch(setFilterError("Please select a sample type before applying samples."));
      return;
    }

    if (!iqaId) {
      dispatch(setFilterError("Unable to determine current user. Please re-login and try again."));
      return;
    }

    if (isApplySamplesDisabled) return;

    // Convert selectedUnitsMap from array format to Set for payload building
    const selectedUnitsMapForPayload: Record<string, Set<string>> = {};
    Object.entries(unitSelection.selectedUnitsMap).forEach(([key, units]) => {
      selectedUnitsMapForPayload[key] = new Set(units);
    });

    const payload = buildApplySamplesPayload({
      selectedPlan,
      sampleType: filterState.sampleType,
      iqaId,
      learnersData: learnersData.learnersData,
      selectedUnitsMap: selectedUnitsMapForPayload,
      dateFrom: filterState.dateFrom,
      selectedMethods: filterState.selectedMethods,
    });

    if (!payload) {
      dispatch(setFilterError("Select at least one learner with sampled units before applying."));
      return;
    }

    try {
      const response = await applySamplePlanLearners(payload).unwrap();
      const successMessage = response?.message || "Sampled learners added successfully.";
      toast.success(successMessage);
      dispatch(setFilterError(""));

      if (selectedPlan) {
        learnersData.triggerSamplePlanLearners(selectedPlan);
      }
    } catch (error: any) {
      const message = error?.data?.message || error?.error || "Failed to apply sampled learners.";
      dispatch(setFilterError(message));
      toast.error(message);
    }
  }, [
    selectedPlan,
    filterState.sampleType,
    filterState.dateFrom,
    filterState.selectedMethods,
    iqaId,
    learnersData,
    unitSelection.selectedUnitsMap,
    applySamplePlanLearners,
    isApplySamplesDisabled,
    dispatch,
  ]);

  const handleOpenLearnerDetailsDialog = useCallback(
    (
      _learner: SamplePlanLearner,
      _learnerIndex: number,
      _detailId?: string | number,
      _unitKey?: string
    ) => {
      // Placeholder - will open EditSampleModal when implemented
      toast.info("Edit sample modal will be implemented");
    },
    []
  );

  const handleApplyRandomSamples = useCallback(async () => {
    // Placeholder - implement random sampling logic if needed
    toast.info("Random sampling functionality will be implemented");
  }, []);


  const getSelectedUnitsForLearner = useCallback(
    (learner: SamplePlanLearner, learnerIndex: number): Set<string> => {
      const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
      const units = unitSelection.selectedUnitsMap[learnerKey] || [];
      return new Set(units);
    },
    [unitSelection.selectedUnitsMap]
  );

  const handleUnitToggleFromTable = useCallback(
    (learner: SamplePlanLearner, learnerIndex: number, unitKey: string) => {
      const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
      dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
    },
    [dispatch]
  );

  return (
    <QASamplePlanLayout>
      <div className="lg:col-span-4">
        <FilterPanel
          onApplySamples={handleApplySamples}
          isApplySamplesDisabled={isApplySamplesDisabled}
          isApplySamplesLoading={isApplySamplesLoading}
          onApplyRandomSamples={handleApplyRandomSamples}
          isApplyRandomSamplesLoading={isApplySamplesLoading}
        />
      </div>

      <div className="lg:col-span-8">
        <LearnersTable />
      </div>
    </QASamplePlanLayout>
  );
}
