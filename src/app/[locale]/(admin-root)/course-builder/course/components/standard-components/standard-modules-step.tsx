/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * StandardModulesStep Component
 * 
 * Step component for managing modules for Standard courses
 * Standard: Modules with topics (subUnits)
 */

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
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
import { StandardTopicsForm } from "./standard-topics-form";

interface StandardModulesStepProps {
  courseId?: string | number | null;
  courseCoreType: CourseCoreType;
  control: Control<CourseFormData>;
  setValue: (name: string, value: any) => void;
  errors?: FieldErrors<CourseFormData>;
}

export function StandardModulesStep({
  control,
  setValue,
  errors,
}: StandardModulesStepProps) {
  const t = useTranslations("courseBuilder");
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

  const handleAddModule = () => {
    // Get current units count for auto-filling sort_order
    const currentUnitsCount = units?.length || 0;
    const newModule = {
      id: Date.now(),
      title: "",
      // unit_ref: "",
      mandatory: true,
      description: "",
      // delivery_method: "",
      // otj_hours: "0",
      // delivery_lead: "",
      sort_order: String(currentUnitsCount + 1), // Auto-fill with next number
      active: true,
      subUnit: [],
    };
    append(newModule, { shouldFocus: false });
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
          <h3 className="text-lg font-semibold">{t("course.standard.modulesTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("course.standard.modulesDescription")}
          </p>
        </div>
        <Button onClick={handleAddModule} className="gap-2" type="button">
          <Plus className="h-4 w-4" />
          {t("course.standard.addModule")}
        </Button>
      </div>

      {errors?.units && fields.length === 0 && (
        <div className="rounded-lg border border-destructive bg-destructive p-3">
          <p className="text-sm text-white font-medium">
            {errors.units.message || t("course.standard.atLeastOneModule")}
          </p>
        </div>
      )}

      {fields.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            {t("course.standard.noModulesYet")}
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
                    {t("course.standard.moduleTitle")} <span className="text-destructive">*</span>
                  </TableHead>
                  {/* <TableHead>
                    {t("course.standard.moduleReference")} <span className="text-destructive">*</span>
                  </TableHead> */}
                  <TableHead>{t("course.standard.description")}</TableHead>
                  <TableHead>{t("course.standard.active")}</TableHead>
                  <TableHead>{t("course.standard.sortOrder")}</TableHead>
                  {/* <TableHead>{t("course.standard.deliveryMethod")}</TableHead>
                  <TableHead>{t("course.standard.otjHours")}</TableHead>
                  <TableHead>{t("course.standard.deliveryLead")}</TableHead> */}
                  <TableHead className="w-[100px] text-center">{t("course.gateway.actions")}</TableHead>
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
                            name={`units.${index}.title`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Input
                                  {...formField}
                                  placeholder={t("course.standard.placeholderModuleTitle")}
                                  className={cn("min-w-[150px]", error && "border-destructive")}
                                />
                                {error && (
                                  <p className="text-xs text-destructive">{error.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell>
                        {/* <TableCell>
                          <Controller
                            name={`units.${index}.unit_ref`}
                            control={control}
                            render={({ field: formField, fieldState: { error } }) => (
                              <div className="space-y-1">
                                <Input
                                  {...formField}
                                  placeholder={t("course.standard.placeholderModuleReference")}
                                  className={cn("min-w-[120px]", error && "border-destructive")}
                                />
                                {error && (
                                  <p className="text-xs text-destructive">{error.message}</p>
                                )}
                              </div>
                            )}
                          />
                        </TableCell> */}
                        <TableCell>
                          <Controller
                            name={`units.${index}.description`}
                            control={control}
                            render={({ field: formField }) => (
                            <Input
                              {...formField}
                              placeholder={t("course.standard.placeholderDescription")}
                              className="min-w-[150px]"
                            />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.active`}
                            control={control}
                            render={({ field: formField }) => (
                              <Select
                                value={formField.value === true || formField.value === undefined ? "true" : "false"}
                                onValueChange={(value) => formField.onChange(value === "true")}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">{t("course.standard.activeOption")}</SelectItem>
                                  <SelectItem value="false">{t("course.standard.inactiveOption")}</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.sort_order`}
                            control={control}
                            render={({ field: formField }) => (
                            <Input
                              {...formField}
                              type="text"
                              placeholder={t("course.standard.placeholderAuto")}
                              className="w-[80px]"
                            />
                            )}
                          />
                        </TableCell>
                        {/* <TableCell>
                          <Controller
                            name={`units.${index}.delivery_method`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                placeholder={t("course.standard.placeholderDeliveryMethod")}
                                className="min-w-[150px]"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.otj_hours`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                type="text"
                                placeholder={t("course.standard.placeholderOtjHours")}
                                className="w-[100px]"
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`units.${index}.delivery_lead`}
                            control={control}
                            render={({ field: formField }) => (
                              <Input
                                {...formField}
                                placeholder={t("course.standard.placeholderDeliveryLead")}
                                className="min-w-[120px]"
                              />
                            )}
                          />
                        </TableCell> */}
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
                          <TableCell colSpan={10} className="p-0">
                            <div className="p-4 bg-muted/50">
                              <StandardTopicsForm
                                control={control}
                                moduleIndex={index}
                                topics={(units?.[index] as any)?.subUnit || []}
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
