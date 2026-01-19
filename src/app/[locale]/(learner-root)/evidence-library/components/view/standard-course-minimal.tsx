/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Control, UseFormSetValue, UseFormTrigger } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";

export interface StandardCourseMinimalProps {
  title: string;
  rows: Array<{
    id: string | number;
    title: string;
    unitId?: string | number;
    courseId?: string | number;
    unitIndex?: number;
    subUnitIndex?: number;
  }>;
  control: Control<any>;
  courseId: string | number;
  findUnitIndex: (unitId: string | number, courseId: number) => number;
  findSubUnitIndex: (unitIndex: number, subUnitId: string | number) => number;
  canEditLearnerFields: boolean;
  canEditTrainerFields: boolean;
  // Evidence count
  getEvidenceCount: (
    courseId: string | number,
    unitId: string | number,
    subunitId?: string | number
  ) => number;
  // Form methods
  setValue: UseFormSetValue<any>;
  trigger: UseFormTrigger<any>;
  unitsWatch: any[];
  learnerMapHandler: (row: any) => void;
  trainerMapHandler: (row: any) => void;
  signedOffHandler: (row: any) => void;
  commentHandler: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: string | number) => void;
  selectAllSignedOffForCombinedHandler?: (combinedSubUnits: any[], checked: boolean) => void;
  combinedSubUnits?: any[];
}

export function StandardCourseMinimal({
  title,
  rows = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  control,
  courseId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findUnitIndex,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  findSubUnitIndex,
  canEditLearnerFields,
  canEditTrainerFields,
  getEvidenceCount,
  setValue,
  trigger,
  unitsWatch,
  learnerMapHandler,
  trainerMapHandler,
  signedOffHandler,
  commentHandler,
  selectAllSignedOffForCombinedHandler,
  combinedSubUnits,
}: StandardCourseMinimalProps) {
  const courseIdNum = typeof courseId === 'string' ? Number(courseId) : courseId;

  // Get current row values from unitsWatch for real-time updates (same as UnitsTable)
  const getCurrentRowValues = React.useCallback((row: any) => {
    const unit = unitsWatch.find((u: any) => String(u.id) === String(row.unitId));
    const hasSubUnitInUnit = unit?.subUnit && unit.subUnit.length > 0;

    if (!hasSubUnitInUnit) {
      const currentUnit = unitsWatch.find(
        (u: any) => String(u.id) === String(row.id || row.unitId)
      );
      return {
        learnerMap: currentUnit?.learnerMap ?? row.learnerMap ?? false,
        trainerMap: currentUnit?.trainerMap ?? row.trainerMap ?? false,
        signedOff: currentUnit?.signedOff ?? row.signedOff ?? false,
        comment: currentUnit?.comment ?? row.comment ?? '',
      };
    } else {
      const currentUnit = unitsWatch.find((u: any) => String(u.id) === String(row.unitId));
      const currentSubUnit = currentUnit?.subUnit?.find(
        (s: any) => String(s.id) === String(row.id)
      );
      return {
        learnerMap: currentSubUnit?.learnerMap ?? row.learnerMap ?? false,
        trainerMap: currentSubUnit?.trainerMap ?? row.trainerMap ?? false,
        signedOff: currentSubUnit?.signedOff ?? row.signedOff ?? false,
        comment: currentSubUnit?.comment ?? row.comment ?? '',
      };
    }
  }, [unitsWatch]);

  // Calculate evidence count (same as UnitsTable)
  const getRowEvidenceCount = React.useCallback((row: any) => {
    const unit = unitsWatch.find((u: any) => String(u.id) === String(row.unitId));
    const hasSubUnitInUnit = unit?.subUnit && unit.subUnit.length > 0;
    if (hasSubUnitInUnit) {
      return getEvidenceCount(courseIdNum, row.unitId!, row.id);
    } else {
      return getEvidenceCount(courseIdNum, row.id || row.unitId!);
    }
  }, [unitsWatch, getEvidenceCount, courseIdNum]);

  // Calculate select all states (same as UnitsTable)
  const allLearnerMapSelected = React.useMemo(() => {
    return rows.every((r) => getCurrentRowValues(r).learnerMap);
  }, [rows, getCurrentRowValues]);

  const allSignedOffSelected = React.useMemo(() => {
    return rows.every((r) => {
      const values = getCurrentRowValues(r);
      return (values.learnerMap && values.trainerMap && values.signedOff);
    });
  }, [rows, getCurrentRowValues]);

  const someSignedOffSelected = React.useMemo(() => {
    return rows.some((r) => {
      const values = getCurrentRowValues(r);
      return (values.learnerMap && values.trainerMap && values.signedOff);
    });
  }, [rows, getCurrentRowValues]);


  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={allLearnerMapSelected}
                    onCheckedChange={(checked) => {
                      // Handle combined variant select all (same as UnitsTable)
                      const updated = [...unitsWatch];
                      rows.forEach((row) => {
                        const unit = updated.find((u: any) => u.id === row.unitId);
                        if (unit) {
                          const hasSubUnitInUnit = unit.subUnit && unit.subUnit.length > 0;
                          if (hasSubUnitInUnit) {
                            unit.subUnit.forEach((usub: any) => {
                              if (usub.id === row.id) {
                                usub.learnerMap = checked === true;
                              }
                            });
                          } else {
                            unit.learnerMap = checked === true;
                          }
                        }
                      });
                      setValue('units', updated);
                      trigger('units');
                    }}
                    disabled={!canEditLearnerFields}
                  />
                  <Label className="text-sm font-medium">Learner Map</Label>
                </div>
              </TableHead>
              <TableHead>{title}</TableHead>
              <TableHead>Trainer Comment</TableHead>
              <TableHead className="text-center">Gap</TableHead>
              <TableHead className="text-center">
                {canEditTrainerFields ? (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={
                        allSignedOffSelected
                          ? true
                          : someSignedOffSelected
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={(checked) => {
                        if (selectAllSignedOffForCombinedHandler && combinedSubUnits) {
                          selectAllSignedOffForCombinedHandler(combinedSubUnits, checked === true);
                        }
                      }}
                    />
                    <Label className="text-sm font-medium">Signed Off</Label>
                  </div>
                ) : (
                  "Signed Off"
                )}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const currentValues = getCurrentRowValues(row);
              const rowKey = `${row.unitId}-${row.id}`;

              return (
                <TableRow key={rowKey}>
                  <TableCell>
                    <Checkbox
                      checked={currentValues.learnerMap}
                      onCheckedChange={() => {
                        learnerMapHandler(row);
                      }}
                      disabled={!canEditLearnerFields}
                    />
                  </TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>
                    {!canEditTrainerFields ? (
                      <span className="text-sm text-muted-foreground">
                        {currentValues.comment || 'No comment'}
                      </span>
                    ) : (
                      <Input
                        value={currentValues.comment}
                        onChange={(e) => {
                          commentHandler(e, row.id);
                        }}
                        placeholder="Trainer comment"
                        className="w-full"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <GapIndicator
                        learnerMap={currentValues.learnerMap}
                        trainerMap={currentValues.trainerMap}
                        signedOff={currentValues.signedOff}
                        onClick={() => {
                          if (canEditTrainerFields && currentValues.learnerMap) {
                            trainerMapHandler(row);
                          }
                        }}
                        disabled={!canEditTrainerFields || !currentValues.learnerMap}
                      />
                      <EvidenceIndicator evidenceCount={getRowEvidenceCount(row)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={currentValues.signedOff}
                      disabled={
                        !canEditTrainerFields ||
                        !currentValues.learnerMap ||
                        !currentValues.trainerMap
                      }
                      onCheckedChange={() => {
                        signedOffHandler(row);
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

