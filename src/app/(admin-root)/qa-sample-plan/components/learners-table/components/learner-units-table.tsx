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
} from "@/store/slices/qaSamplePlanSlice";
import { toast } from "sonner";

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
      const unitKey = unitData.unit_code != null 
        ? String(unitData.unit_code) 
        : unitData.unit_name || "";
      if (unitKey && !selectedUnitsSet.has(unitKey)) {
        dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
      }
    });
  };

  const handleDeselectAll = () => {
    const learnerKey = `${learner.learner_name ?? ""}-${learnerIndex}`;
    units.forEach((unit) => {
      const unitData = unit as SamplePlanLearnerUnit;
      const unitKey = unitData.unit_code != null 
        ? String(unitData.unit_code) 
        : unitData.unit_name || "";
      if (unitKey && selectedUnitsSet.has(unitKey)) {
        dispatch(toggleUnitForLearner({ learnerKey, unitKey }));
      }
    });
  };

  const handleOpenLearnerDetailsDialog = (
    detailId?: string | number,
    unitKey?: string
  ) => {
    // Placeholder - will open EditSampleModal when implemented
    toast.info("Edit sample modal will be implemented");
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
    const unitKey = unitData.unit_code != null 
      ? String(unitData.unit_code) 
      : unitData.unit_name || "";
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
          // Convert unit_code to string for consistent key handling (unit_code can be number or string)
          const unitKey = unitData.unit_code != null 
            ? String(unitData.unit_code) 
            : unitData.unit_name || "";
          const isUnitSelected = unitKey ? selectedUnitsSet.has(unitKey) : false;
          const hasSampleHistory = Array.isArray(unitData.sample_history) && unitData.sample_history.length > 0;
          const firstHistory = hasSampleHistory && unitData.sample_history ? unitData.sample_history[0] : null;

          return (
            <div
              key={`unit-${unitKey || unitIndex}`}
              className="border rounded p-3 hover:border-primary/50 transition-colors flex-shrink-0 w-[300px]"
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
                    className="w-4 h-4 flex-shrink-0"
                  />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium leading-tight truncate" title={unitData.unit_name || "Unit"}>
                    {sanitizeText(unitData.unit_name || "Unit")}
                  </p>
                </div>
                <Badge variant={getUnitStatusBadge(unitData.status)} className="text-xs flex-shrink-0">
                  {typeof unitData.status === "string"
                    ? unitData.status
                    : unitData.status
                      ? "Completed"
                      : "Incomplete"}
                </Badge>
              </div>
              {firstHistory && (
                <div className="mt-2">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs hover:text-primary underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      const detailId = (firstHistory as { detail_id?: string | number }).detail_id;
                      if (detailId) {
                        handleOpenLearnerDetailsDialog(detailId, unitKey);
                      }
                    }}
                  >
                    {formatDisplayDate((firstHistory as { planned_date?: string }).planned_date)}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
