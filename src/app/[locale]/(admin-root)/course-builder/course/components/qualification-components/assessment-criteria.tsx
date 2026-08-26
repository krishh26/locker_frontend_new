/**
 * TopicsForm Component
 *
 * Component for managing topics within assessment criteria (subUnits)
 * Used inside AssessmentCriteriaForm for Qualification courses
 */

"use client";

import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Controller,
  Control,
  useFieldArray,
  useWatch,
  UseFormSetValue,
} from "react-hook-form";
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
  const t = useTranslations("courseBuilder");
  const { fields, append, remove } = useFieldArray({
    control,
    name: `units.${unitIndex}.subUnit.${subUnitIndex}.topics`,
  });

  const parentShowOrder = useWatch({
    control,
    name: `units.${unitIndex}.subUnit.${subUnitIndex}.showOrder`,
  });

  const learningOutcomeOrder = Number(parentShowOrder) || subUnitIndex + 1;

  const handleAddTopic = () => {
    const nextOrder = fields.length + 1;
    const newTopic = {
      id: Date.now(),
      title: "",
      type: "Knowledge",
      showOrder: nextOrder,
      code: `${learningOutcomeOrder}.${nextOrder}`,
    };
    append(newTopic, { shouldFocus: false }); // Don't focus and don't trigger validation
  };

  // Auto-update showOrder + hierarchical Sr No. (e.g. 1.1, 1.2) when topics or LO order change
  useEffect(() => {
    if (fields.length > 0 && setValue) {
      fields.forEach((_, index) => {
        const expectedShowOrder = index + 1;
        const expectedCode = `${learningOutcomeOrder}.${expectedShowOrder}`;
        const currentShowOrder = topics?.[index]?.showOrder;
        const currentCode = topics?.[index]?.code;

        if (currentShowOrder !== expectedShowOrder) {
          setValue(
            `units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.showOrder` as any,
            expectedShowOrder,
            {
              shouldValidate: false,
              shouldDirty: false,
            }
          );
        }

        if (currentCode !== expectedCode) {
          setValue(
            `units.${unitIndex}.subUnit.${subUnitIndex}.topics.${index}.code` as any,
            expectedCode,
            {
              shouldValidate: false,
              shouldDirty: false,
            }
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length, unitIndex, subUnitIndex, learningOutcomeOrder]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {topics.length > 0
            ? t("course.qualification.assessmentCriteriaCount", { count: topics.length })
            : t("course.qualification.assessmentCriteria")}
        </h4>
        {!readOnly && (
          <Button onClick={handleAddTopic} size="sm" variant="outline" className="gap-2" type="button">
            <Plus className="h-4 w-4" />
            {t("course.qualification.addAssessmentCriteria")}
          </Button>
        )}
      </div>

      {fields.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("course.qualification.srNo")}</TableHead>
                  <TableHead>{t("course.qualification.showOrder")}</TableHead>
                  <TableHead>
                    {t("course.qualification.title")} <span className="text-destructive">*</span>
                  </TableHead>
                  {!readOnly && (
                    <TableHead className="w-[100px] text-center">{t("course.gateway.actions")}</TableHead>
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
                            value={
                              formField.value ||
                              `${learningOutcomeOrder}.${index + 1}`
                            }
                            placeholder={t("course.qualification.placeholderSrNo")}
                            className="w-[100px]"
                            disabled
                            readOnly
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
                            placeholder={t("course.qualification.placeholderAuto")}
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
                              placeholder={t("course.qualification.placeholderTopicTitle")}
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
