/**
 * AssessmentCriteriaForm Component
 * 
 * Component for managing assessment criteria (subUnits) within a unit
 * Used inside expandable unit rows in Qualification courses
 */

"use client";

import React, { useState, useEffect } from "react";
import { Controller, Control, useFieldArray, useWatch, UseFormSetValue } from "react-hook-form";
import type { CourseFormData } from "@/store/api/course/types";
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
import { TopicsForm } from "./assessment-criteria";

interface AssessmentCriteriaFormProps {
  control: Control<CourseFormData>;
  unitIndex: number;
  assessmentCriteria: any[];
  setValue?: UseFormSetValue<CourseFormData>;
  readOnly?: boolean;
}

export function AssessmentCriteriaForm({
  control,
  unitIndex,
  assessmentCriteria,
  setValue,
  readOnly = false,
}: AssessmentCriteriaFormProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { fields, append, remove } = useFieldArray({
    control,
    name: `units.${unitIndex}.subUnit`,
  });

  const subUnits = useWatch({
    control,
    name: `units.${unitIndex}.subUnit`,
    defaultValue: [],
  });

  const handleAddCriterion = () => {
    const newCriterion = {
      id: Date.now(),
      code: "",
      title: "",
      type: "to-do" as const,
      showOrder: fields.length + 1,
      timesMet: 0,
      topics: [],
    };
    append(newCriterion, { shouldFocus: false }); // Don't focus and don't trigger validation
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

  // Auto-update showOrder when criteria are added/removed
  useEffect(() => {
    if (fields.length > 0 && setValue) {
      fields.forEach((_, index) => {
        const expectedShowOrder = index + 1;
        const currentValue = subUnits?.[index]?.showOrder;
        // Only update if the value needs to change
        if (currentValue !== expectedShowOrder) {
          setValue(`units.${unitIndex}.subUnit.${index}.showOrder` as any, expectedShowOrder, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length, unitIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Learning Outcome {assessmentCriteria.length > 0 && `(${assessmentCriteria.length})`}
        </h4>
        {!readOnly && (
          <Button onClick={handleAddCriterion} size="sm" className="gap-2" type="button">
            <Plus className="h-4 w-4" />
            Add Learning Outcome
          </Button>
        )}
      </div>

      {fields.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>
                    Type <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Show Order</TableHead>
                  <TableHead>
                    Title <span className="text-destructive">*</span>
                  </TableHead>
                  {!readOnly && (
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  )}
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
                            type="button"
                            className="h-8 w-8"
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
                            name={`units.${unitIndex}.subUnit.${index}.type`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Select
                                  value={formField.value || "to-do"}
                                  onValueChange={formField.onChange}
                                  disabled={readOnly}
                                >
                                  <SelectTrigger className={cn("w-[120px]", error && "border-destructive")}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="to-do">To Do</SelectItem>
                                    <SelectItem value="to-know">To Know</SelectItem>
                                    <SelectItem value="req">Required</SelectItem>
                                  </SelectContent>
                                </Select>
                                {error && (
                                  <p className="text-xs text-destructive">{error.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${unitIndex}.subUnit.${index}.code`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                placeholder="Code"
                                className="w-[100px]"
                                disabled={readOnly}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${unitIndex}.subUnit.${index}.showOrder`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                type="number"
                                placeholder="Auto"
                                className="w-[80px]"
                                value={formField.value ?? index + 1}
                                disabled={readOnly}
                                onChange={(e) =>
                                  formField.onChange(Number(e.target.value) || index + 1)
                                }
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${unitIndex}.subUnit.${index}.title`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Input
                                  {...formField}
                                  placeholder="Criterion title"
                                  className={cn(error && "border-destructive")}
                                  disabled={readOnly}
                                />
                                {error && (
                                  <p className="text-xs text-destructive">{error.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>
                        {!readOnly && (
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-destructive hover:text-destructive"
                              type="button"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={readOnly ? 5 : 6} className="p-0">
                            <div className="p-4 bg-muted/30">
                              <TopicsForm
                                control={control}
                                unitIndex={unitIndex}
                                subUnitIndex={index}
                                topics={(subUnits?.[index] as any)?.topics || []}
                                readOnly={readOnly}
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
