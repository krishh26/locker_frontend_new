/**
 * StandardTopicsForm Component
 * 
 * Component for managing topics (subUnits) within Standard course modules
 * Used inside StandardModulesStep for Standard courses
 */

"use client";

import React from "react";
import { Controller, Control, useFieldArray, UseFormSetValue } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StandardTopicsFormProps {
  control: Control<CourseFormData>;
  moduleIndex: number;
  topics: any[];
  setValue?: UseFormSetValue<CourseFormData>;
  readOnly?: boolean;
}

export function StandardTopicsForm({
  control,
  moduleIndex,
  topics = [],
  setValue,
  readOnly = false,
}: StandardTopicsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `units.${moduleIndex}.subUnit`,
  });

  const handleAddTopic = () => {
    const newTopic = {
      id: Date.now(),
      title: "",
      type: "Behaviour" as const,
    };
    append(newTopic, { shouldFocus: false }); // Don't focus and don't trigger validation
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Assessment Criteria {topics.length > 0 && `(${topics.length})`}
        </h4>
        {!readOnly && (
          <Button onClick={handleAddTopic} size="sm" className="gap-2" type="button">
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
                  <TableHead>
                    Type <span className="text-destructive">*</span>
                  </TableHead>
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
                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`units.${moduleIndex}.subUnit.${index}.type`}
                          control={control}
                          render={({ field: formField, fieldState: { error } }) => (
                            <div className="space-y-1">
                              <Select
                                value={formField.value || "Behaviour"}
                                onValueChange={formField.onChange}
                                disabled={readOnly}
                              >
                                <SelectTrigger className={cn("w-[150px]", error && "border-destructive")}>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Behaviour">Behaviour</SelectItem>
                                  <SelectItem value="Knowledge">Knowledge</SelectItem>
                                  <SelectItem value="Skills">Skills</SelectItem>
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
                          name={`units.${moduleIndex}.subUnit.${index}.title`}
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
                            type="button"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
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
