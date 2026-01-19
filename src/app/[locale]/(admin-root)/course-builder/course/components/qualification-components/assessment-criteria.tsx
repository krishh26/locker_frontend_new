/**
 * TopicsForm Component
 * 
 * Component for managing topics within assessment criteria (subUnits)
 * Used inside AssessmentCriteriaForm for Qualification courses
 */

"use client";

import React, { useEffect } from "react";
import { Controller, Control, useFieldArray, UseFormSetValue } from "react-hook-form";
import type { CourseFormData } from "@/store/api/course/types";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicsFormProps {
  control: Control<CourseFormData>;
  unitIndex: number;
  subUnitIndex: number;
  topics: any[];
  readOnly?: boolean;
  setValue?: UseFormSetValue<CourseFormData>;
}

export function TopicsForm({
  control,
  unitIndex,
  subUnitIndex,
  topics = [],
  readOnly = false,
  setValue,
}: TopicsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `units.${unitIndex}.subUnit.${subUnitIndex}.topics`,
  });

  const handleAddTopic = () => {
    const newTopic = {
      id: Date.now(),
      title: "",
      type: "Knowledge",
      showOrder: fields.length + 1,
      code: "",
    };
    append(newTopic, { shouldFocus: false }); // Don't focus and don't trigger validation
  };

  // Auto-update showOrder when topics are added/removed
  useEffect(() => {
    if (fields.length > 0 && setValue) {
      fields.forEach((_, index) => {
        const expectedShowOrder = index + 1;
        const currentValue = topics?.[index]?.showOrder;
        // Only update if the value needs to change
        if (currentValue !== expectedShowOrder) {
          setValue(
            `units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.showOrder` as any,
            expectedShowOrder,
            {
              shouldValidate: false,
              shouldDirty: false,
            }
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length, unitIndex, subUnitIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Assessment Criteria {topics.length > 0 && `(${topics.length})`}
        </h4>
        {!readOnly && (
          <Button onClick={handleAddTopic} size="sm" variant="outline" className="gap-2" type="button">
            <Plus className="h-4 w-4" />
            Add Assessment Criteria
          </Button>
        )}
      </div>

      {fields.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Controller
                        name={`units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.code`}
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
                        name={`units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.showOrder`}
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
                        name={`units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.title`}
                        control={control}
                        render={({ field: formField, fieldState: { error } }) => (
                          <div className="space-y-1">
                            <Input
                              {...formField}
                              placeholder="Topic title"
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
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
