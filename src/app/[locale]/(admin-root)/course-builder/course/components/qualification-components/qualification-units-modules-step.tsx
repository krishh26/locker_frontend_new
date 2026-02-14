/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * QualificationUnitsModulesStep Component
 * 
 * Step component for managing units for Qualification courses
 * Qualification: Units with assessment criteria
 */

"use client";

import React, { useState } from "react";
import { Controller, Control, useFieldArray, useWatch, FieldErrors } from "react-hook-form";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssessmentCriteriaForm } from "./learning-outcome";

interface QualificationUnitsModulesStepProps {
  courseId?: string | number | null;
  courseCoreType: CourseCoreType;
  control: Control<CourseFormData>;
  setValue: (name: string, value: any) => void;
  errors?: FieldErrors<CourseFormData>;
}

export function QualificationUnitsModulesStep({
  courseId,
  courseCoreType,
  control,
  setValue,
  errors,
}: QualificationUnitsModulesStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { fields, append, remove } = useFieldArray({
    control,
    name: "units",
  });

  const units = useWatch({
    control,
    name: "units",
    defaultValue: [],
  });

  const handleAddUnit = () => {
    const newUnit = {
      id: Date.now(),
      title: "",
      mandatory: true,
      unit_ref: "",
      level: null,
      glh: null,
      credit_value: null,
      subUnit: [],
    };
    append(newUnit);
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Units</h3>
          <p className="text-sm text-muted-foreground">
            Add and manage units with outcomes and criteria for your qualification course
          </p>
        </div>
        <Button onClick={handleAddUnit} className="gap-2" type="button">
          <Plus className="h-4 w-4" />
          Add Unit
        </Button>
      </div>

      {errors?.units && fields.length === 0 && (
        <div className="rounded-lg border border-destructive bg-destructive p-3">
          <p className="text-sm text-white font-medium">
            {errors.units.message || "At least one unit is required"}
          </p>
        </div>
      )}

      {fields.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            No units added yet. Click &quot;Add Unit&quot; to get started.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>
                    Unit Ref <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead>
                    Unit Title <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>GLH</TableHead>
                  <TableHead>Credit Value</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const isExpanded = expandedRows.has(index);
                  return (
                    <React.Fragment key={field.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            type="button"
                            onClick={() => toggleRow(index)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.unit_ref`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Input
                                  {...formField}
                                  placeholder="Unit Ref"
                                  className={cn(
                                    "w-[120px]",
                                    error && "border-destructive"
                                  )}
                                />
                                {error && (
                                  <p className="text-xs text-destructive">
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.title`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Input
                                  {...formField}
                                  placeholder="Unit Title"
                                  className={cn(error && "border-destructive")}
                                />
                                {error && (
                                  <p className="text-xs text-destructive">
                                    {error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.level`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                type="number"
                                placeholder="Level"
                                className="w-[100px]"
                                value={formField.value ?? ""}
                                onChange={(e) =>
                                  formField.onChange(
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.glh`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                type="number"
                                placeholder="GLH"
                                className="w-[100px]"
                                value={formField.value ?? ""}
                                onChange={(e) =>
                                  formField.onChange(
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.credit_value`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                type="number"
                                placeholder="Credit"
                                className="w-[100px]"
                                value={formField.value ?? ""}
                                onChange={(e) =>
                                  formField.onChange(
                                    e.target.value ? Number(e.target.value) : null
                                  )
                                }
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.mandatory`}
                            control={control}
                            render={({ field: formField }) => (
                              <Select
                                value={formField.value === true || formField.value === undefined ? "true" : "false"}
                                onValueChange={(value) => formField.onChange(value === "true")}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Mandatory</SelectItem>
                                  <SelectItem value="false">Optional</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4 bg-muted/50">
                              <AssessmentCriteriaForm
                                control={control}
                                unitIndex={index}
                                assessmentCriteria={(units?.[index] as any)?.subUnit || []}
                                setValue={setValue}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
