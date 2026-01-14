"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { Download, Filter, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectQASamplePlanState,
  selectSelectedCourse,
  selectSelectedPlan,
  selectPlans,
  selectFilterState,
  selectUnitSelection,
  setDateFrom,
  setDateTo,
  setFilterApplied,
  setFilterError,
  resetFilters,
} from "@/store/slices/qaSamplePlanSlice";
import { useGetSamplePlansQuery } from "@/store/api/qa-sample-plan/qaSamplePlanApi";
import { useLearnersData } from "../../qa-sample-plan-page-content/hooks/use-learners-data";
import { filterVisibleRows } from "../../qa-sample-plan-page-content/utils/filter-utils";
import { sanitizeText, formatDisplayDate, getLearnerPlannedDate } from "../../utils";
import { countSelectedUnits } from "../../utils";
import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";

interface ActionButtonsProps {
  triggerSamplePlanLearners?: (planId: string) => void;
}

export const ActionButtons = memo(function ActionButtons({ triggerSamplePlanLearners: triggerFromParent }: ActionButtonsProps) {
  const dispatch = useAppDispatch();
  const qaState = useAppSelector(selectQASamplePlanState);
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const selectedPlan = useAppSelector(selectSelectedPlan);
  const plans = useAppSelector(selectPlans);
  const filterState = useAppSelector(selectFilterState);
  const unitSelection = useAppSelector(selectUnitSelection);

  // Get current user for plans query
  const user = useAppSelector((state) => state.auth.user);
  const iqaId = user?.user_id as string | number | undefined;

  // RTK Query - Plans loading state
  const samplePlanQueryArgs = useMemo(() => {
    if (!selectedCourse || !iqaId) return undefined;
    return { course_id: selectedCourse, iqa_id: iqaId };
  }, [selectedCourse, iqaId]);

  const {
    isFetching: isPlansFetching,
    isLoading: isPlansLoading,
  } = useGetSamplePlansQuery(
    samplePlanQueryArgs as { course_id: string; iqa_id: number },
    { skip: !samplePlanQueryArgs }
  );

  const isPlanListLoading = isPlansFetching || isPlansLoading;

  // Learners data - Use parent's trigger if provided, otherwise create own hook instance
  const learnersData = useLearnersData(
    selectedPlan,
    filterState.filterApplied,
    filterState.searchText
  );

  // Use parent's trigger function if provided, otherwise use hook's trigger
  const triggerSamplePlanLearners = triggerFromParent || learnersData.triggerSamplePlanLearners;

  // For action buttons, we just need the trigger function and loading state
  // The actual data display is handled by LearnersTable
  const visibleRows = useMemo(() => {
    return filterVisibleRows(learnersData.learnersData, filterState.searchText, filterState.filterApplied);
  }, [learnersData.learnersData, filterState.searchText, filterState.filterApplied]);

  // Course name
  const courseName = useMemo(() => {
    if (qaState.planSummary?.courseName) return qaState.planSummary.courseName;
    // Could also get from courses query if needed
    return "";
  }, [qaState.planSummary]);

  const [exporting, setExporting] = useState(false);

  // Get selected units helper
  const getSelectedUnitsForLearner = useCallback(
    (learner: SamplePlanLearner, learnerIndex: number): Set<string> => {
      const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
      const units = unitSelection.selectedUnitsMap[learnerKey] || [];
      return new Set(units);
    },
    [unitSelection.selectedUnitsMap]
  );

  // Apply filter handler
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
    triggerSamplePlanLearners(selectedPlan);
  }, [selectedCourse, plans, selectedPlan, dispatch, triggerSamplePlanLearners]);

  const handleExportToCSV = () => {
    if (!visibleRows.length) {
      toast.warning("No data available to export");
      return;
    }

    try {
      setExporting(true);
      const headers = [
        "Assessor Name",
        "Learner Name",
        "Learner ID",
        "Risk Level",
        "QA Approved",
        "Total Units",
        "Selected Units",
        "Planned Date",
        "Course Name",
      ];

      const csvRows = visibleRows.map((row, index) => {
        const units = Array.isArray(row.units) ? row.units : [];
        const selectedUnitsSet = getSelectedUnitsForLearner(row, index);
        const selectedUnits = selectedUnitsSet.size || countSelectedUnits(units);
        const plannedDate = getLearnerPlannedDate(row);

        return [
          sanitizeText(row.assessor_name),
          sanitizeText(row.learner_name),
          row.learner_id || row.learnerId || row.id || "-",
          sanitizeText(row.risk_level),
          row.qa_approved ? "Yes" : "No",
          units.length.toString(),
          selectedUnits.toString(),
          plannedDate ? formatDisplayDate(plannedDate) : "-",
          courseName || "-",
        ];
      });

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `qa-sample-plan-learners-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data. Please try again.");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="flex gap-4 flex-1">
        <div className="space-y-2 flex-1">
          <Label>Date From</Label>
          <Input
            type="date"
            value={filterState.dateFrom}
            onChange={(e) => dispatch(setDateFrom(e.target.value))}
          />
        </div>
        <div className="space-y-2 flex-1">
          <Label>Date To</Label>
          <Input
            type="date"
            value={filterState.dateTo}
            onChange={(e) => dispatch(setDateTo(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleExportToCSV}
          disabled={!filterState.filterApplied || !visibleRows.length || learnersData.isLearnersInFlight || exporting}
        >
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleApplyFilter}
          disabled={!selectedCourse || !selectedPlan || isPlanListLoading || !plans.length || learnersData.isLearnersInFlight}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        <Button
          variant="outline"
          onClick={() => dispatch(resetFilters())}
          disabled={learnersData.isLearnersInFlight}
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
});
