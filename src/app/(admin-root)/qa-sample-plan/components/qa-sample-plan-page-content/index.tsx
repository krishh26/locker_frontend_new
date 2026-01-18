"use client";

import {
  useApplySamplePlanLearnersMutation,
  useGetSamplePlansQuery,
} from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Plan } from "@/store/slices/qaSamplePlanSlice";
import {
  resetSelectedUnits,
  selectFilterState,
  selectQASamplePlanState,
  selectSelectedCourse,
  selectSelectedPlan,
  selectUnitSelection,
  setFilterError,
  setPlans,
  setSelectedPlan,
  setSelectedUnitsMap
} from "@/store/slices/qaSamplePlanSlice";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { FilterPanel } from "../filter-panel";
import { LearnersTable } from "../learners-table";
import { QASamplePlanLayout } from "./components/qa-sample-plan-layout";
import { useLearnersData } from "./hooks/use-learners-data";
import { buildApplySamplesPayload } from "./utils/apply-samples-payload";
import { EditSampleModalWrapper } from "../edit-sample-modal/edit-sample-modal-wrapper";

export function QASamplePlanPageContent() {
  const dispatch = useAppDispatch();
  
  // Get current user
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id as string | number | undefined;

  // Redux state
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const qaState = useAppSelector(selectQASamplePlanState);
  const selectedPlan = qaState.selectedPlan; // Use same source as LearnersTable
  const filterState = useAppSelector(selectFilterState);
  const unitSelection = useAppSelector(selectUnitSelection);

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

    if (!iqaId) {
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
      iqaId,
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
    iqaId,
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

    if (!iqaId) {
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
      iqaId,
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
    iqaId,
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
          <LearnersTable learnersData={learnersData} />
        </div>
      </QASamplePlanLayout>
      <EditSampleModalWrapper />
    </>
  );
}
