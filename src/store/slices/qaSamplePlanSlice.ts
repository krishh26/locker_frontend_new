import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { assessmentMethods, qaStatuses } from "@/app/[locale]/(admin-root)/qa-sample-plan/utils/constants";

export interface Plan {
  id: string;
  label: string;
}

export interface PlanSummary {
  planId?: string;
  courseName?: string;
}

interface QASamplePlanState {
  // Selection state
  selectedCourse: string;
  selectedPlan: string;
  plans: Plan[];
  plansLoading: boolean;
  plansError: string | null;

  // Filter state
  selectedMethods: string[];
  selectedStatus: string;
  sampleType: string;
  dateFrom: string;
  dateTo: string;
  plannedSampleDate: string;
  searchText: string;
  onlyIncomplete: boolean;

  // UI state
  filterApplied: boolean;
  filterError: string;
  planSummary: PlanSummary | undefined;

  // Unit selection (using arrays instead of Set for Redux serialization)
  selectedUnitsMap: Record<string, string[]>;
  unitSelectionDialogOpen: boolean;
  selectedLearnerForUnits: {
    learner: Record<string, unknown>;
    learnerIndex: number;
  } | null;

  // Edit Sample Modal state
  editSampleModalOpen: boolean;
  currentPlanDetailId: string | number | null;
  currentUnitCode: string | null;
  currentUnitName: string | null;
  currentUnitType: string | null;
}

const initialState: QASamplePlanState = {
  selectedCourse: "",
  selectedPlan: "",
  plans: [],
  plansLoading: false,
  plansError: null,
  selectedMethods: assessmentMethods.map((method) => method.code),
  selectedStatus: qaStatuses[0],
  sampleType: "",
  dateFrom: "",
  dateTo: "",
  plannedSampleDate: "",
  searchText: "",
  onlyIncomplete: false,
  filterApplied: false,
  filterError: "",
  planSummary: undefined,
  selectedUnitsMap: {},
  unitSelectionDialogOpen: false,
  selectedLearnerForUnits: null,
  editSampleModalOpen: false,
  currentPlanDetailId: null,
  currentUnitCode: null,
  currentUnitName: null,
  currentUnitType: null,
};

const qaSamplePlanSlice = createSlice({
  name: "qaSamplePlan",
  initialState,
  reducers: {
    setSelectedCourse: (state, action: PayloadAction<string>) => {
      state.selectedCourse = action.payload;
      state.selectedPlan = "";
      state.plans = [];
      state.filterApplied = false;
      state.filterError = "";
    },
    setSelectedPlan: (state, action: PayloadAction<string>) => {
      state.selectedPlan = action.payload;
      state.filterApplied = false;
      state.filterError = "";
    },
    setPlans: (state, action: PayloadAction<Plan[]>) => {
      state.plans = action.payload;
      // Clear selected plan if it's not in the new plans list
      if (action.payload.length > 0 && !action.payload.some((plan) => plan.id === state.selectedPlan)) {
        state.selectedPlan = "";
        state.filterApplied = false;
      }
    },
    setPlansLoading: (state, action: PayloadAction<boolean>) => {
      state.plansLoading = action.payload;
    },
    setPlansError: (state, action: PayloadAction<string | null>) => {
      state.plansError = action.payload;
    },
    setSelectedMethods: (state, action: PayloadAction<string[]>) => {
      state.selectedMethods = action.payload;
    },
    toggleMethod: (state, action: PayloadAction<string>) => {
      const code = action.payload;
      if (state.selectedMethods.includes(code)) {
        state.selectedMethods = state.selectedMethods.filter((item) => item !== code);
      } else {
        state.selectedMethods.push(code);
      }
    },
    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
    },
    setSampleType: (state, action: PayloadAction<string>) => {
      state.sampleType = action.payload;
    },
    setDateFrom: (state, action: PayloadAction<string>) => {
      state.dateFrom = action.payload;
    },
    setDateTo: (state, action: PayloadAction<string>) => {
      state.dateTo = action.payload;
    },
    setPlannedSampleDate: (state, action: PayloadAction<string>) => {
      state.plannedSampleDate = action.payload;
    },
    setSearchText: (state, action: PayloadAction<string>) => {
      state.searchText = action.payload;
    },
    setOnlyIncomplete: (state, action: PayloadAction<boolean>) => {
      state.onlyIncomplete = action.payload;
    },
    setFilterApplied: (state, action: PayloadAction<boolean>) => {
      state.filterApplied = action.payload;
    },
    setFilterError: (state, action: PayloadAction<string>) => {
      state.filterError = action.payload;
    },
    setPlanSummary: (state, action: PayloadAction<PlanSummary | undefined>) => {
      state.planSummary = action.payload;
    },
    setSelectedUnitsMap: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.selectedUnitsMap = action.payload;
    },
    toggleUnitForLearner: (
      state,
      action: PayloadAction<{ learnerKey: string; unitKey: string }>
    ) => {
      const { learnerKey, unitKey } = action.payload;
      const current = state.selectedUnitsMap[learnerKey] || [];
      if (current.includes(unitKey)) {
        state.selectedUnitsMap[learnerKey] = current.filter((key) => key !== unitKey);
      } else {
        state.selectedUnitsMap[learnerKey] = [...current, unitKey];
      }
    },
    resetSelectedUnits: (state) => {
      state.selectedUnitsMap = {};
    },
    setUnitSelectionDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.unitSelectionDialogOpen = action.payload;
    },
    setSelectedLearnerForUnits: (
      state,
      action: PayloadAction<{ learner: Record<string, unknown>; learnerIndex: number } | null>
    ) => {
      state.selectedLearnerForUnits = action.payload;
      if (action.payload) {
        const learnerKey = `${action.payload.learner.learner_name ?? ""}-${action.payload.learnerIndex}`;
        if (!state.selectedUnitsMap[learnerKey]) {
          state.selectedUnitsMap[learnerKey] = [];
        }
      }
    },
    resetFilters: (state) => {
      state.selectedMethods = assessmentMethods.map((method) => method.code);
      state.selectedStatus = qaStatuses[0];
      state.sampleType = "";
      state.dateFrom = "";
      state.dateTo = "";
      state.searchText = "";
      state.onlyIncomplete = false;
      state.filterApplied = false;
      state.filterError = "";
      state.planSummary = undefined;
    },
    openEditSampleModal: (
      state,
      action: PayloadAction<{
        detailId: string | number;
        unitCode?: string | null;
        unitName?: string | null;
        unitType?: string | null;
      }>
    ) => {
      state.editSampleModalOpen = true;
      state.currentPlanDetailId = action.payload.detailId;
      state.currentUnitCode = action.payload.unitCode ?? null;
      state.currentUnitName = action.payload.unitName ?? null;
      state.currentUnitType = action.payload.unitType ?? null;
    },
    closeEditSampleModal: (state) => {
      state.editSampleModalOpen = false;
      state.currentPlanDetailId = null;
      state.currentUnitCode = null;
      state.currentUnitName = null;
      state.currentUnitType = null;
    },
    setCurrentPlanDetailId: (state, action: PayloadAction<string | number | null>) => {
      state.currentPlanDetailId = action.payload;
    },
  },
});

export const {
  setSelectedCourse,
  setSelectedPlan,
  setPlans,
  setPlansLoading,
  setPlansError,
  setSelectedMethods,
  toggleMethod,
  setSelectedStatus,
  setSampleType,
  setDateFrom,
  setDateTo,
  setPlannedSampleDate,
  setSearchText,
  setOnlyIncomplete,
  setFilterApplied,
  setFilterError,
  setPlanSummary,
  setSelectedUnitsMap,
  toggleUnitForLearner,
  resetSelectedUnits,
  setUnitSelectionDialogOpen,
  setSelectedLearnerForUnits,
  resetFilters,
  openEditSampleModal,
  closeEditSampleModal,
  setCurrentPlanDetailId,
} = qaSamplePlanSlice.actions;

// Selectors
export const selectQASamplePlanState = (state: RootState) => state.qaSamplePlan;

export const selectSelectedCourse = (state: RootState) => state.qaSamplePlan.selectedCourse;
export const selectSelectedPlan = (state: RootState) => state.qaSamplePlan.selectedPlan;
export const selectPlans = (state: RootState) => state.qaSamplePlan.plans;
export const selectPlansLoading = (state: RootState) => state.qaSamplePlan.plansLoading;
export const selectPlansError = (state: RootState) => state.qaSamplePlan.plansError;

export const selectFilterState = (state: RootState) => ({
  selectedMethods: state.qaSamplePlan.selectedMethods,
  selectedStatus: state.qaSamplePlan.selectedStatus,
  sampleType: state.qaSamplePlan.sampleType,
  dateFrom: state.qaSamplePlan.dateFrom,
  dateTo: state.qaSamplePlan.dateTo,
  plannedSampleDate: state.qaSamplePlan.plannedSampleDate,
  searchText: state.qaSamplePlan.searchText,
  onlyIncomplete: state.qaSamplePlan.onlyIncomplete,
  filterApplied: state.qaSamplePlan.filterApplied,
  filterError: state.qaSamplePlan.filterError,
});

export const selectUnitSelection = (state: RootState) => ({
  selectedUnitsMap: state.qaSamplePlan.selectedUnitsMap,
  unitSelectionDialogOpen: state.qaSamplePlan.unitSelectionDialogOpen,
  selectedLearnerForUnits: state.qaSamplePlan.selectedLearnerForUnits,
});

export const selectEditSampleModal = (state: RootState) => ({
  editSampleModalOpen: state.qaSamplePlan.editSampleModalOpen,
  currentPlanDetailId: state.qaSamplePlan.currentPlanDetailId,
  currentUnitCode: state.qaSamplePlan.currentUnitCode,
  currentUnitName: state.qaSamplePlan.currentUnitName,
  currentUnitType: state.qaSamplePlan.currentUnitType,
});

// Computed selectors - these will be computed in components using RTK Query hooks
// Keeping simple selectors here for basic state access

// Selector hooks (imported at component level to avoid circular dependencies)

export default qaSamplePlanSlice.reducer;
