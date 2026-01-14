"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { SamplePlanLearner, SamplePlanLearnerUnit } from "@/store/api/qa-sample-plan/types";

export interface SelectedLearnerForUnits {
  learner: SamplePlanLearner;
  learnerIndex: number;
}

interface UnitSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLearnerForUnits: SelectedLearnerForUnits | null;
  selectedUnitsMap: Record<string, Set<string>>;
  onUnitToggle: (unitKey: string) => void;
  onSave: () => void;
}

export function UnitSelectionDialog({
  open,
  onClose,
  selectedLearnerForUnits,
  selectedUnitsMap,
  onUnitToggle,
  onSave,
}: UnitSelectionDialogProps) {
  if (!selectedLearnerForUnits) return null;

  const learnerKey = `${selectedLearnerForUnits.learner.learner_name ?? ""}-${selectedLearnerForUnits.learnerIndex}`;
  const selectedUnits = selectedUnitsMap[learnerKey] || new Set<string>();
  const units = selectedLearnerForUnits.learner.units || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Units</DialogTitle>
          <DialogDescription>
            Select units for {selectedLearnerForUnits.learner.learner_name || "learner"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Learner Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-1">
                <div className="font-semibold">
                  Learner: {selectedLearnerForUnits.learner.learner_name || "N/A"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Assessor: {selectedLearnerForUnits.learner.assessor_name || "N/A"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Units List */}
          <div className="max-h-[50vh] overflow-y-auto border rounded-md p-4 space-y-3">
            {units.length > 0 ? (
              units.map((unit: SamplePlanLearnerUnit, unitIndex: number) => {
                const unitKey = unit.unit_code || unit.unit_name || "";
                const isSelected = unitKey ? selectedUnits.has(unitKey) : false;

                return (
                  <Card
                    key={`unit-${unitKey || unitIndex}`}
                    className={isSelected ? "border-primary bg-primary/5" : ""}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`unit-${unitKey || unitIndex}`}
                          checked={isSelected}
                          onCheckedChange={() => onUnitToggle(unitKey)}
                        />
                        <Label
                          htmlFor={`unit-${unitKey || unitIndex}`}
                          className="flex-1 cursor-pointer space-y-1"
                        >
                          <div className="font-semibold">
                            {unit.unit_name || "Unit"}
                          </div>
                          {unit.unit_code && (
                            <div className="text-sm text-muted-foreground">
                              Code: {unit.unit_code}
                            </div>
                          )}
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No units available for this learner.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Selection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

