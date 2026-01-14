"use client";

import { useState, useCallback, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoursePlanSelector } from "./components/course-plan-selector";
import { FilterControls } from "./components/filter-controls";
import { ActionButtons } from "./components/action-buttons";
import { SearchExpandControls } from "./components/search-expand-controls";
import { LearnersTableContent } from "./components/learners-table-content";
import {
  selectQASamplePlanState,
  selectFilterState,
} from "@/store/slices/qaSamplePlanSlice";
import { useLearnersData } from "../qa-sample-plan-page-content/hooks/use-learners-data";

export function LearnersTable() {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Redux state
  const qaState = useAppSelector(selectQASamplePlanState);
  const filterState = useAppSelector(selectFilterState);

  // Learners data
  const learnersData = useLearnersData(
    qaState.selectedPlan,
    filterState.filterApplied,
    filterState.searchText
  );

  // Use visibleRows directly from the hook (already filtered)
  const visibleRows = learnersData.visibleRows;

  const toggleRowExpansion = useCallback((index: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const toggleAllRowsExpansion = useCallback(() => {
    if (expandedRows.size === visibleRows.length && visibleRows.length > 0) {
      setExpandedRows(new Set());
    } else {
      const allIndices = new Set(visibleRows.map((_, index) => index));
      setExpandedRows(allIndices);
    }
  }, [expandedRows.size, visibleRows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learners</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course and Plan Selection */}
        <CoursePlanSelector />

        {/* Filter Controls */}
        <FilterControls />

        {/* Date Filters and Action Buttons */}
        <ActionButtons triggerSamplePlanLearners={learnersData.triggerSamplePlanLearners} />

        {/* Error Message */}
        {filterState.filterError && (
          <div className="text-sm text-destructive font-medium">{filterState.filterError}</div>
        )}

        {/* Plan Summary */}
        {filterState.filterApplied && !filterState.filterError && qaState.planSummary && (
          <div className="text-sm text-muted-foreground">
            Viewing plan <strong>{qaState.planSummary.planId ? `#${qaState.planSummary.planId}` : "N/A"}</strong>
            {qaState.planSummary.courseName ? ` • ${qaState.planSummary.courseName}` : ""}
          </div>
        )}

        {/* Search and Expand Controls */}
        <SearchExpandControls
          expandedRows={expandedRows}
          onToggleAllRowsExpansion={toggleAllRowsExpansion}
          visibleRows={visibleRows}
          isLearnersInFlight={learnersData.isLearnersInFlight}
        />

        {/* Table */}
        <LearnersTableContent
          expandedRows={expandedRows}
          onToggleRowExpansion={toggleRowExpansion}
          visibleRows={visibleRows}
          isLearnersInFlight={learnersData.isLearnersInFlight}
          isLearnersError={learnersData.isLearnersError}
        />
      </CardContent>
    </Card>
  );
}
