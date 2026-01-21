"use client";

import {
  useApplySamplePlanLearnersMutation,
  useGetSamplePlansQuery,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import type { SamplePlanQueryParams } from "@/store/api/qa-sample-plan/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Plan } from "@/store/slices/qaSamplePlanSlice";
import {
  resetSelectedUnits,
  selectFilterState,
  selectQASamplePlanState,
  selectSelectedCourse,
  selectUnitSelection,
  setFilterError,
  setPlans,
  setPlansLoading,
  setPlansError,
  setSelectedPlan,
  setSelectedUnitsMap,
  setSelectedCourse,
  setFilterApplied,
} from "@/store/slices/qaSamplePlanSlice";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import { FilterPanel } from "../filter-panel";
import { LearnersTable } from "../learners-table";
import { QASamplePlanLayout } from "./components/qa-sample-plan-layout";
import { useLearnersData } from "./hooks/use-learners-data";
import { buildApplySamplesPayload } from "./utils/apply-samples-payload";
import { EditSampleModalWrapper } from "../edit-sample-modal/edit-sample-modal-wrapper";

export function QASamplePlanPageContent() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current user
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isEqa = userRole === "EQA";
  const userId = user?.user_id as string | number | undefined;

  // Read course_id from URL params
  const courseIdFromUrl = searchParams.get("course_id");

  // Redux state
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const qaState = useAppSelector(selectQASamplePlanState);
  const selectedPlan = qaState.selectedPlan; // Use same source as LearnersTable
  const filterState = useAppSelector(selectFilterState);
  const unitSelection = useAppSelector(selectUnitSelection);

  // Get courses data for validation
  const { data: coursesData } = useGetCoursesQuery(
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
    if (!selectedCourse || !userId) return undefined;
    if (isEqa) {
      return { course_id: selectedCourse, eqaId: userId };
    }
    return { course_id: selectedCourse, iqa_id: userId };
  }, [selectedCourse, userId, isEqa]);

  const {
    data: samplePlanResponse,
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
    isError: isPlansError,
    error: plansError,
  } = useGetSamplePlansQuery(
    samplePlanQueryArgs as SamplePlanQueryParams,
    { skip: !samplePlanQueryArgs }
  );

  const isPlanListLoading = isPlansFetching || isPlansLoading;

  // Sync loading and error states to Redux
  useEffect(() => {
    dispatch(setPlansLoading(isPlanListLoading));
  }, [isPlanListLoading, dispatch]);

  useEffect(() => {
    if (isPlansError) {
      const errorMessage = plansError && typeof plansError === 'object' && 'data' in plansError
        ? (plansError.data as { error?: string; message?: string })?.error || 
          (plansError.data as { error?: string; message?: string })?.message
        : plansError instanceof Error
        ? plansError.message
        : typeof plansError === 'string'
        ? plansError
        : "Failed to load plans";
      dispatch(setPlansError(errorMessage || null));
    } else {
      dispatch(setPlansError(null));
    }
  }, [isPlansError, plansError, dispatch]);

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

    const rawPlanDataSource = (samplePlanResponse as { data?: Record<string, unknown> } | undefined)?.data ?? samplePlanResponse ?? null;
    let rawPlans: Array<Record<string, unknown>> = [];

    if (Array.isArray(rawPlanDataSource)) {
      rawPlans = rawPlanDataSource;
    } else if (rawPlanDataSource && typeof rawPlanDataSource === "object" && Object.keys(rawPlanDataSource).length > 0) {
      rawPlans = [rawPlanDataSource];
    } else if (Array.isArray((samplePlanResponse as { data?: { data?: unknown[] } } | undefined)?.data?.data)) {
      rawPlans = (samplePlanResponse as { data?: { data?: Record<string, unknown>[] } } | undefined)?.data?.data ?? [];
    }

    if (rawPlans.length) {
      const normalizedPlans: Plan[] = rawPlans
        .map((plan: Record<string, unknown>) => {
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

  // EQA course validation and auto-set
  useEffect(() => {
    if (!isEqa || !courseIdFromUrl || courses.length === 0) return;

    // Validate course_id exists in courses data
    const courseExists = courses.some((course) => course.id === courseIdFromUrl);

    if (!courseExists) {
      // Invalid course_id, redirect back
      toast.error("Invalid course. Redirecting...");
      // router.push("/learners");
      return;
    }

    // Valid course_id, set it as selected course if not already set
    if (selectedCourse !== courseIdFromUrl) {
      dispatch(setSelectedCourse(courseIdFromUrl));
    }
  }, [isEqa, courseIdFromUrl, courses, selectedCourse, dispatch, router]);

  // Learners data hook (keeps API logic, dispatches Redux actions)
  const learnersData = useLearnersData(
    selectedPlan,
    filterState.filterApplied,
    filterState.searchText
  );

  // Auto-trigger filter for EQA users when course and plan are ready
  useEffect(() => {
    if (!isEqa || !courseIdFromUrl || !selectedCourse || selectedCourse !== courseIdFromUrl) return;
    if (isPlanListLoading || !qaState.plans.length) return;
    if (filterState.filterApplied) return; // Already applied

    // Auto-select first plan if no plan is selected
    if (!selectedPlan && qaState.plans.length > 0) {
      dispatch(setSelectedPlan(qaState.plans[0].id));
      return; // Will trigger again when selectedPlan is set
    }

    // If plan is selected, auto-trigger filter
    if (selectedPlan && qaState.plans.some((plan) => plan.id === selectedPlan)) {
      dispatch(setFilterError(""));
      dispatch(setFilterApplied(true));
      learnersData.triggerSamplePlanLearners(selectedPlan);
    }
  }, [
    isEqa,
    courseIdFromUrl,
    selectedCourse,
    selectedPlan,
    isPlanListLoading,
    qaState.plans,
    filterState.filterApplied,
    dispatch,
    learnersData,
  ]);

  // Apply samples mutation
  const [applySamplePlanLearners, { isLoading: isApplySamplesLoading }] = useApplySamplePlanLearnersMutation();

  // Handle learners error
  useEffect(() => {
    if (learnersData.isLearnersError && learnersData.learnersError) {
      const apiError = learnersData.learnersError as { data?: { message?: string }; message?: string };
      const message = apiError.data?.message || apiError.message || "Failed to fetch learners for the selected plan.";
      dispatch(setFilterError(message));
    }
  }, [learnersData.isLearnersError, learnersData.learnersError, dispatch]);

  // Reset selected units when learners data changes
  useEffect(() => {
    if (learnersData.learnersData.length > 0) {
      dispatch(resetSelectedUnits());
    }
  }, [learnersData.learnersData.length, dispatch]);



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

  const handleApplySamples = useCallback(async () => {
    if (!selectedPlan) {
      dispatch(setFilterError("Please select a plan before applying samples."));
      return;
    }

    if (!filterState.sampleType) {
      dispatch(setFilterError("Please select a sample type before applying samples."));
      return;
    }

    if (!userId) {
      dispatch(setFilterError("Unable to determine current user. Please re-login and try again."));
      return;
    }

    if (isApplySamplesDisabled) return;

    // Check if at least one unit is selected
    const hasAtLeastOneSelectedUnit = Object.values(unitSelection.selectedUnitsMap).some(
      (units) => units.length > 0
    );
    
    if (!hasAtLeastOneSelectedUnit) {
      dispatch(setFilterError("Please select at least one unit before applying samples."));
      return;
    }

    // Convert selectedUnitsMap from array format to Set for payload building
    // Ensure all unit keys are strings to match the payload builder logic
    const selectedUnitsMapForPayload: Record<string, Set<string>> = {};
    Object.entries(unitSelection.selectedUnitsMap).forEach(([key, units]) => {
      // Convert all unit values to strings to ensure type consistency
      selectedUnitsMapForPayload[key] = new Set(units.map((unit) => String(unit)));
    });

    const payload = buildApplySamplesPayload({
      selectedPlan,
      sampleType: filterState.sampleType,
      iqaId: userId,
      learnersData: learnersData.learnersData,
      selectedUnitsMap: selectedUnitsMapForPayload,
      dateFrom: filterState.plannedSampleDate,
      selectedMethods: filterState.selectedMethods,
    });

    console.log("payload", payload);

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
    } catch (error: unknown) {
      const errorData = error as { data?: { message?: string }; message?: string };
      const message = errorData.data?.message || errorData.message || "Failed to apply sampled learners.";
      dispatch(setFilterError(message));
      toast.error(message);
    }
  }, [
    selectedPlan,
    filterState.sampleType,
    filterState.plannedSampleDate,
    filterState.selectedMethods,
    userId,
    learnersData,
    unitSelection.selectedUnitsMap,
    applySamplePlanLearners,
    isApplySamplesDisabled,
    dispatch,
  ]);


  const handleApplyRandomSamples = useCallback(async () => {
    if (!selectedPlan) {
      dispatch(setFilterError("Please select a plan before applying samples."));
      return;
    }

    if (!filterState.sampleType) {
      dispatch(setFilterError("Please select a sample type before applying samples."));
      return;
    }

    if (!userId) {
      dispatch(setFilterError("Unable to determine current user. Please re-login and try again."));
      return;
    }

    if (isApplySamplesDisabled) {
      return;
    }

    if (!filterState.plannedSampleDate.trim()) {
      dispatch(setFilterError("Planned Sample Date is required"));
      return;
    }

    if (!learnersData.learnersData.length) {
      dispatch(setFilterError("No learners available to apply random samples."));
      return;
    }

    // Randomly select units for all learners based on risk_percentage
    const updatedSelectedUnitsMap: Record<string, Set<string>> = {};

    learnersData.learnersData.forEach((row, rowIndex) => {
      const units = Array.isArray(row.units) ? row.units : [];
      if (units.length === 0) {
        return;
      }

      // Get risk_percentage (e.g., "50.00" or 50)
      const riskPercentageRaw = (row as Record<string, unknown>).risk_percentage;
      const riskPercentage = riskPercentageRaw
        ? parseFloat(String(riskPercentageRaw))
        : 0;

      // Calculate number of units to select based on risk percentage
      // If risk_percentage is 50, select 50% of units
      const totalUnits = units.length;
      const unitsToSelect = Math.max(
        1,
        Math.round((riskPercentage / 100) * totalUnits)
      );

      // Get all unit keys (must match the logic in buildApplySamplesPayload)
      const unitKeys: string[] = units
        .map((unit: Record<string, unknown>) => {
          const unitKey = unit.unit_code || unit.unit_name || "";
          return String(unitKey);
        })
        .filter((key: string): key is string => Boolean(key && key.trim()));

      // Randomly shuffle and select the required number
      const shuffled = [...unitKeys].sort(() => Math.random() - 0.5);
      const selectedUnitKeys = shuffled.slice(0, unitsToSelect);

      // Store in the map
      const learnerKey = `${row.learner_name ?? ""}-${rowIndex}`;
      updatedSelectedUnitsMap[learnerKey] = new Set(selectedUnitKeys);
    });

    // Convert Set to array for Redux (selectedUnitsMap uses Record<string, string[]>)
    const updatedSelectedUnitsMapForRedux: Record<string, string[]> = {};
    Object.entries(updatedSelectedUnitsMap).forEach(([key, unitSet]) => {
      updatedSelectedUnitsMapForRedux[key] = Array.from(unitSet);
    });

    // Update the selectedUnitsMap state
    dispatch(setSelectedUnitsMap(updatedSelectedUnitsMapForRedux));

    // Convert back to Set for payload building (buildApplySamplesPayload expects Record<string, Set<string>>)
    const selectedUnitsMapForPayload: Record<string, Set<string>> = {};
    Object.entries(updatedSelectedUnitsMapForRedux).forEach(([key, units]) => {
      selectedUnitsMapForPayload[key] = new Set(units);
    });

    // Build and apply samples payload
    const payload = buildApplySamplesPayload({
      selectedPlan,
      sampleType: filterState.sampleType,
      iqaId: userId,
      learnersData: learnersData.learnersData,
      selectedUnitsMap: selectedUnitsMapForPayload,
      dateFrom: filterState.plannedSampleDate,
      selectedMethods: filterState.selectedMethods,
    });

    if (!payload) {
      dispatch(setFilterError("No learners with units available to apply random samples."));
      return;
    }


    try {
      const response = await applySamplePlanLearners(payload).unwrap();
      const successMessage = response?.message || "Random sampled learners added successfully.";
      toast.success(successMessage);
      dispatch(setFilterError(""));

      // Refresh the learners table data
      if (selectedPlan) {
        learnersData.triggerSamplePlanLearners(selectedPlan);
      }
    } catch (error: unknown) {
      const errorData = error as { data?: { message?: string }; message?: string };
      const message = errorData.data?.message || errorData.message || "Failed to apply random sampled learners.";
      dispatch(setFilterError(message));
      toast.error(message);
    }
  }, [
    selectedPlan,
    filterState.sampleType,
    filterState.plannedSampleDate,
    filterState.selectedMethods,
    userId,
    learnersData,
    isApplySamplesDisabled,
    applySamplePlanLearners,
    dispatch,
  ]);


  return (
    <>
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
          <LearnersTable 
            learnersData={learnersData} 
            disableCourseSelector={isEqa && !!courseIdFromUrl}
          />
        </div>
      </QASamplePlanLayout>
      <EditSampleModalWrapper />
    </>
  );
}
