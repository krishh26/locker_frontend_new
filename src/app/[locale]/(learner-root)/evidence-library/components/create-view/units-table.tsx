/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Controller, Control, FieldError, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import type { EvidenceFormValues } from "./evidence-form-types";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";
import { COURSE_TYPES } from "../constants";

interface UnitsTableProps {
  control: Control<EvidenceFormValues>;
  courses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: any[];
  }>;
  disabled?: boolean;
  error?: FieldError;
}

export function UnitsTable({
  control,
  courses,
  disabled,
  error,
}: UnitsTableProps) {
  // Always call hooks first - before any conditional returns
  const watchedUnits = useWatch({ control, name: "units" });
  const courseSelectedTypes = useWatch({ control, name: "courseSelectedTypes" }) || {};
  const units = useMemo(() => watchedUnits || [], [watchedUnits]);

  // Group units by course - always compute this
  const unitsByCourse = useMemo(() => {
    if (!units || units.length === 0) {
      return {} as Record<number, { course: any; units: any[] }>;
    }
    return courses.reduce((acc, course) => {
      const courseUnits = units.filter(
        (u: any) => u.course_id === course.course_id
      );
      if (courseUnits.length > 0) {
        acc[course.course_id] = {
          course,
          units: courseUnits,
        };
      }
      return acc;
    }, {} as Record<number, { course: any; units: any[] }>);
  }, [courses, units]);

  // Create stable index mapping - this ensures indices don't change unexpectedly
  const unitIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    units.forEach((unit: any, index: number) => {
      const key = `${unit.course_id}-${unit.id}`;
      map.set(key, index);
    });
    return map;
  }, [units]);

  // Find unit index by id and course_id - use stable mapping
  const findUnitIndex = (unitId: string | number, courseId: number) => {
    const key = `${courseId}-${unitId}`;
    return unitIndexMap.get(key) ?? -1;
  };

  // Find sub-unit index - memoize to avoid recalculation
  const findSubUnitIndex = (unitIndex: number, subUnitId: string | number) => {
    const unit = units[unitIndex];
    if (!unit?.subUnit) return -1;
    return unit.subUnit.findIndex(
      (s: any) => String(s.id) === String(subUnitId)
    );
  };

  // Early return AFTER all hooks are called
  if (!units || units.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Select courses and units to see mappings
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(unitsByCourse).map(({ course, units: courseUnits }) => {
        // For Standard courses, group units by type
        const isStandardCourse = course.course_core_type === COURSE_TYPES.STANDARD;
        
        if (isStandardCourse) {
          // Group units by type
          const unitsByType = new Map<string, typeof courseUnits>();
          courseUnits.forEach((unit: any) => {
            const unitType = unit.type || '';
            if (!unitsByType.has(unitType)) {
              unitsByType.set(unitType, []);
            }
            unitsByType.get(unitType)!.push(unit);
          });

          // Get selected types for this course
          const selectedTypes = courseSelectedTypes[course.course_id] || [];
          
          return (
            <div key={course.course_id} className="space-y-4">
              {Array.from(unitsByType.entries()).map(([unitType, unitsOfType]) => {
                // Check if this type is selected
                const isTypeSelected = selectedTypes.includes(unitType);
                
                // Check if at least one learnerMap is checked for this type
                const hasLearnerMap = unitsOfType.some((unit: any) => {
                  if (unit.subUnit && unit.subUnit.length > 0) {
                    return unit.subUnit.some((sub: any) => sub.learnerMap === true);
                  }
                  return unit.learnerMap === true;
                });
                
                // Show error if type is selected but no learnerMap is checked
                const hasError = error && isTypeSelected && !hasLearnerMap;
                
                return (
                <Card key={unitType} className={`p-4 ${hasError ? 'border-destructive border-2' : ''}`}>
                  <h3 className="font-semibold mb-4">
                    {course.course_name} - {unitType} Units
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Learner Map</TableHead>
                          <TableHead>Unit/Sub Unit</TableHead>
                          <TableHead>Trainer Comment</TableHead>
                          <TableHead className="text-center">Gap</TableHead>
                          <TableHead className="text-center">Signed Off</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unitsOfType.map((unit: any) => {
                  const unitIndex = findUnitIndex(unit.id, course.course_id);
                  // Skip if unit index is invalid (shouldn't happen, but safety check)
                  if (unitIndex === -1) {
                    return <TableRow key={`invalid-${unit.id}`} style={{ display: 'none' }} />;
                  }
                  const hasSubUnits = unit.subUnit && unit.subUnit.length > 0;

                  if (hasSubUnits) {
                    // Render sub-units
                    return unit.subUnit.map((subUnit: any) => {
                      const subIndex = findSubUnitIndex(unitIndex, subUnit.id);
                      // Skip if sub-unit index is invalid
                      if (subIndex === -1) {
                        return <TableRow key={`invalid-${unit.id}-${subUnit.id}`} style={{ display: 'none' }} />;
                      }
                      // Use stable key based on IDs, not indices
                      const stableKey = `${course.course_id}-${unit.id}-${subUnit.id}`;
                      return (
                        <TableRow key={stableKey}>
                          <TableCell>
                            <Controller
                              key={`${stableKey}-learnerMap`}
                              name={`units.${unitIndex}.subUnit.${subIndex}.learnerMap` as any}
                              control={control}
                              render={({ field: subField }) => (
                                <Checkbox
                                  checked={subField.value || false}
                                  onCheckedChange={subField.onChange}
                                  disabled={disabled}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>{subUnit.title}</TableCell>
                          <TableCell>
                            <Controller
                              key={`${stableKey}-comment`}
                              name={`units.${unitIndex}.subUnit.${subIndex}.comment` as any}
                              control={control}
                              render={({ field: subField }) => (
                                <Input
                                  {...subField}
                                  placeholder="Trainer comment"
                                  disabled={disabled}
                                  className="w-full"
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <GapIndicator
                                learnerMap={subUnit.learnerMap || false}
                                trainerMap={subUnit.trainerMap || false}
                                signedOff={subUnit.signedOff || false}
                                disabled={disabled}
                              />
                              <EvidenceIndicator evidenceCount={0} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Controller
                              key={`${stableKey}-signedOff`}
                              name={`units.${unitIndex}.subUnit.${subIndex}.signedOff` as any}
                              control={control}
                              render={({ field: subField }) => (
                                <Checkbox
                                  checked={subField.value || false}
                                  onCheckedChange={subField.onChange}
                                  disabled={
                                    disabled ||
                                    !subUnit.learnerMap ||
                                    !subUnit.trainerMap
                                  }
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    });
                  } else {
                    // Render unit without sub-units
                    const stableKey = `${course.course_id}-${unit.id}`;
                    return (
                      <TableRow key={stableKey}>
                        <TableCell>
                          <Controller
                            key={`${stableKey}-learnerMap`}
                            name={`units.${unitIndex}.learnerMap` as any}
                            control={control}
                            render={({ field: unitField }) => (
                              <Checkbox
                                checked={unitField.value || false}
                                onCheckedChange={unitField.onChange}
                                disabled={disabled}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>{unit.title}</TableCell>
                        <TableCell>
                          <Controller
                            key={`${stableKey}-comment`}
                            name={`units.${unitIndex}.comment` as any}
                            control={control}
                            render={({ field: unitField }) => (
                              <Input
                                {...unitField}
                                placeholder="Trainer comment"
                                disabled={disabled}
                                className="w-full"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <GapIndicator
                              learnerMap={unit.learnerMap || false}
                              trainerMap={unit.trainerMap || false}
                              signedOff={unit.signedOff || false}
                              disabled={disabled}
                            />
                            <EvidenceIndicator evidenceCount={0} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Controller
                            key={`${stableKey}-signedOff`}
                            name={`units.${unitIndex}.signedOff` as any}
                            control={control}
                            render={({ field: unitField }) => (
                              <Checkbox
                                checked={unitField.value || false}
                                onCheckedChange={unitField.onChange}
                                disabled={
                                  disabled ||
                                  !unit.learnerMap ||
                                  !unit.trainerMap
                                }
                              />
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
                      </TableBody>
                    </Table>
                  </div>
                  {hasError && (
                    <div className="mt-2">
                      <p className="text-sm text-destructive font-medium">
                        Please check at least one Learner Map for {unitType} type
                      </p>
                    </div>
                  )}
                </Card>
                );
              })}
            </div>
          );
        }

        // For non-Standard courses, show units as before
        return (
          <Card key={course.course_id} className="p-4">
            <h3 className="font-semibold mb-4">{course.course_name}</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner Map</TableHead>
                    <TableHead>Unit/Sub Unit</TableHead>
                    <TableHead>Trainer Comment</TableHead>
                    <TableHead className="text-center">Gap</TableHead>
                    <TableHead className="text-center">Signed Off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseUnits.map((unit: any) => {
                    const unitIndex = findUnitIndex(unit.id, course.course_id);
                    // Skip if unit index is invalid (shouldn't happen, but safety check)
                    if (unitIndex === -1) {
                      return <TableRow key={`invalid-${unit.id}`} style={{ display: 'none' }} />;
                    }
                    const hasSubUnits = unit.subUnit && unit.subUnit.length > 0;

                    if (hasSubUnits) {
                      // Render sub-units
                      return unit.subUnit.map((subUnit: any) => {
                        const subIndex = findSubUnitIndex(unitIndex, subUnit.id);
                        // Skip if sub-unit index is invalid
                        if (subIndex === -1) {
                          return <TableRow key={`invalid-${unit.id}-${subUnit.id}`} style={{ display: 'none' }} />;
                        }
                        // Use stable key based on IDs, not indices
                        const stableKey = `${course.course_id}-${unit.id}-${subUnit.id}`;
                        return (
                          <TableRow key={stableKey}>
                            <TableCell>
                              <Controller
                                key={`${stableKey}-learnerMap`}
                                name={`units.${unitIndex}.subUnit.${subIndex}.learnerMap` as any}
                                control={control}
                                render={({ field: subField }) => (
                                  <Checkbox
                                    checked={subField.value || false}
                                    onCheckedChange={subField.onChange}
                                    disabled={disabled}
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>{subUnit.title}</TableCell>
                            <TableCell>
                              <Controller
                                key={`${stableKey}-comment`}
                                name={`units.${unitIndex}.subUnit.${subIndex}.comment` as any}
                                control={control}
                                render={({ field: subField }) => (
                                  <Input
                                    {...subField}
                                    placeholder="Trainer comment"
                                    disabled={disabled}
                                    className="w-full"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <GapIndicator
                                  learnerMap={subUnit.learnerMap || false}
                                  trainerMap={subUnit.trainerMap || false}
                                  signedOff={subUnit.signedOff || false}
                                  disabled={disabled}
                                />
                                <EvidenceIndicator evidenceCount={0} />
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Controller
                                key={`${stableKey}-signedOff`}
                                name={`units.${unitIndex}.subUnit.${subIndex}.signedOff` as any}
                                control={control}
                                render={({ field: subField }) => (
                                  <Checkbox
                                    checked={subField.value || false}
                                    onCheckedChange={subField.onChange}
                                    disabled={
                                      disabled ||
                                      !subUnit.learnerMap ||
                                      !subUnit.trainerMap
                                    }
                                  />
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      });
                    } else {
                      // Render unit without sub-units
                      const stableKey = `${course.course_id}-${unit.id}`;
                      return (
                        <TableRow key={stableKey}>
                          <TableCell>
                            <Controller
                              key={`${stableKey}-learnerMap`}
                              name={`units.${unitIndex}.learnerMap` as any}
                              control={control}
                              render={({ field: unitField }) => (
                                <Checkbox
                                  checked={unitField.value || false}
                                  onCheckedChange={unitField.onChange}
                                  disabled={disabled}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell>{unit.title}</TableCell>
                          <TableCell>
                            <Controller
                              key={`${stableKey}-comment`}
                              name={`units.${unitIndex}.comment` as any}
                              control={control}
                              render={({ field: unitField }) => (
                                <Input
                                  {...unitField}
                                  placeholder="Trainer comment"
                                  disabled={disabled}
                                  className="w-full"
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center">
                              <GapIndicator
                                learnerMap={unit.learnerMap || false}
                                trainerMap={unit.trainerMap || false}
                                signedOff={unit.signedOff || false}
                                disabled={disabled}
                              />
                              <EvidenceIndicator evidenceCount={0} />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Controller
                              key={`${stableKey}-signedOff`}
                              name={`units.${unitIndex}.signedOff` as any}
                              control={control}
                              render={({ field: unitField }) => (
                                <Checkbox
                                  checked={unitField.value || false}
                                  onCheckedChange={unitField.onChange}
                                  disabled={
                                    disabled ||
                                    !unit.learnerMap ||
                                    !unit.trainerMap
                                  }
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        );
      })}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
