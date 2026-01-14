import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import type { SelectedLearnerForUnits } from "../unit-selection-dialog";

export interface Course {
  id: string;
  name: string;
}

export interface Plan {
  id: string;
  label: string;
}

export interface PlanSummary {
  planId?: string;
  courseName?: string;
}

export interface FilterState {
  selectedMethods: string[];
  selectedStatus: string;
  sampleType: string;
  dateFrom: string;
  dateTo: string;
  searchText: string;
  onlyIncomplete: boolean;
}

export interface FilterApplicationState {
  filterApplied: boolean;
  filterError: string;
  planSummary?: PlanSummary;
}

export interface UnitSelectionState {
  unitSelectionDialogOpen: boolean;
  selectedLearnerForUnits: SelectedLearnerForUnits | null;
  selectedUnitsMap: Record<string, Set<string>>;
}

export interface LearnersDataState {
  learnersData: SamplePlanLearner[];
  visibleRows: SamplePlanLearner[];
  isLearnersInFlight: boolean;
  isLearnersError: boolean;
  hasPlannedDate: boolean;
}
