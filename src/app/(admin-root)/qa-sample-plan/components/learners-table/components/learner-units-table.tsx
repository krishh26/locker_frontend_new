"use client";

import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SamplePlanLearner, SamplePlanLearnerUnit } from "@/store/api/qa-sample-plan/types";
import { sanitizeText, formatDisplayDate } from "../../utils";
import { useAppDispatch } from "@/store/hooks";
import {
  toggleUnitForLearner,
  openEditSampleModal,
} from "@/store/slices/qaSamplePlanSlice";

interface LearnerUnitsTableProps {
  learner: SamplePlanLearner;
  learnerIndex: number;
  units: SamplePlanLearnerUnit[];
  selectedUnitsSet: Set<string>;
}

const getUnitStatusBadge = (status: string | boolean | undefined) => {
  if (typeof status === "boolean") {
    return status ? "default" : "secondary";
  }
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (normalized.includes("completed")) return "default";
    if (normalized.includes("partial")) return "secondary";
    if (normalized.includes("not started")) return "destructive";
  }
  return "outline";
};

export const LearnerUnitsTable = memo(function LearnerUnitsTable({
  learner,
  learnerIndex,
  units,
  selectedUnitsSet,
}: LearnerUnitsTableProps) {
  const dispatch = useAppDispatch();

  const handleUnitToggle = (unitKey: string) => {
    const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
    dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
  };

  const handleSelectAll = () => {
    const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
    units.forEach((unit) => {
      const unitData = unit as SamplePlanLearnerUnit;
      // Match old implementation: use unit_code if truthy, else unit_name, else empty string
      const unitKey = unitData.unit_code || unitData.unit_name || "";
      if (unitKey && !selectedUnitsSet.has(unitKey)) {
        dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
      }
    });
  };

  const handleDeselectAll = () => {
    const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
    units.forEach((unit) => {
      const unitData = unit as SamplePlanLearnerUnit;
      // Match old implementation: use unit_code if truthy, else unit_name, else empty string
      const unitKey = unitData.unit_code || unitData.unit_name || "";
      if (unitKey && selectedUnitsSet.has(unitKey)) {
        dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
      }
    });
  };

  const handleOpenLearnerDetailsDialog = (
    detailId?: string | number,
    unitKey?: string
  ) => {
    if (!detailId) {
      return;
    }

    // Find the unit data to get unit information
    const unitData = units.find((unit) => {
      const unitData = unit as SamplePlanLearnerUnit;
      // Match old implementation: use unit_code if truthy, else unit_name, else empty string
      const currentUnitKey = unitData.unit_code || unitData.unit_name || "";
      return currentUnitKey === unitKey;
    }) as SamplePlanLearnerUnit | undefined;

    // Extract unit information
    const unitCode = unitData?.unit_code != null ? String(unitData.unit_code) : unitKey || null;
    const unitName = unitData?.unit_name || null;
    const unitType = (unitData as SamplePlanLearnerUnit & { type?: string })?.type || null;

    // Dispatch action to open the modal
    dispatch(openEditSampleModal({
      detailId,
      unitCode,
      unitName,
      unitType,
    }));
  };

  if (units.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No units available for this learner.
      </p>
    );
  }

  const allUnitsSelected = units.every((unit) => {
    const unitData = unit as SamplePlanLearnerUnit;
    // Match old implementation: use unit_code if truthy, else unit_name, else empty string
    const unitKey = unitData.unit_code || unitData.unit_name || "";
    return !unitKey || selectedUnitsSet.has(unitKey);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={allUnitsSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              handleSelectAll();
            } else {
              handleDeselectAll();
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          {units.length} unit(s) available
        </span>
      </div>
      <div className="flex overflow-x-auto gap-1 pb-2">
        {units.map((unit, unitIndex: number) => {
          const unitData = unit as SamplePlanLearnerUnit & { status?: string | boolean };
          // Match old implementation: use unit_code if truthy, else unit_name, else empty string
          const unitKey = unitData.unit_code || unitData.unit_name || "";
          const isUnitSelected = unitKey ? selectedUnitsSet.has(unitKey) : false;
          const sampleHistory = Array.isArray(unitData.sample_history) ? unitData.sample_history : [];

          return (
            <div
              key={`unit-${unitKey || unitIndex}`}
              className="border rounded p-3 hover:border-primary/50 transition-colors shrink-0 w-[300px]"
            >
              <div className="flex items-center border-b pb-2 gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isUnitSelected}
                    onCheckedChange={() => {
                      if (unitKey) {
                        handleUnitToggle(unitKey);
                      }
                    }}
                    className="w-4 h-4 shrink-0"
                  />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium leading-tight truncate" title={unitData.unit_name || "Unit"}>
                    {sanitizeText(unitData.unit_name || "Unit")}
                  </p>
                </div>
                <Badge variant={getUnitStatusBadge(unitData.status)} className="text-xs shrink-0">
                  {typeof unitData.status === "string"
                    ? unitData.status
                    : unitData.status
                      ? "Completed"
                      : "Incomplete"}
                </Badge>
              </div>
              {sampleHistory.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  {sampleHistory.map((history, historyIndex) => {
                    const detailId = (history as { detail_id?: string | number }).detail_id;
                    const plannedDate = (history as { planned_date?: string }).planned_date;
                    if (!detailId || !plannedDate) return null;
                    return (
                      <Button
                        key={`history-${detailId}-${historyIndex}`}
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs hover:text-primary underline justify-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLearnerDetailsDialog(detailId, unitKey);
                        }}
                      >
                        {formatDisplayDate(plannedDate)}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
