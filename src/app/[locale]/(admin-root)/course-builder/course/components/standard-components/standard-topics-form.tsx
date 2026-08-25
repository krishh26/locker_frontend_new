/**
 * StandardTopicsForm Component
 *
 * Component for managing topics (subUnits) within Standard course modules
 * Used inside StandardModulesStep for Standard courses
 *
 * Sr No. is auto-generated per type within the module:
 * Knowledge → K1, K2… | Behaviour → B1, B2… | Skills → S1, S2…
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

type CriterionType = "Behaviour" | "Knowledge" | "Skills";

const TYPE_PREFIX: Record<CriterionType, string> = {
  Knowledge: "K",
  Behaviour: "B",
  Skills: "S",
};

function getTypePrefix(type: string | undefined): string {
  if (type === "Knowledge" || type === "Behaviour" || type === "Skills") {
    return TYPE_PREFIX[type];
  }
  return TYPE_PREFIX.Behaviour;
}

/** Build K1/B1/S1… codes from row order, counting separately per type. */
export function buildStandardSrNos(
  topics: Array<{ type?: string } | null | undefined>
): string[] {
  const counters: Record<string, number> = {
    Knowledge: 0,
    Behaviour: 0,
    Skills: 0,
  };

  return topics.map((topic) => {
    const type = (topic?.type as CriterionType) || "Behaviour";
    const key =
      type === "Knowledge" || type === "Behaviour" || type === "Skills"
        ? type
        : "Behaviour";
    counters[key] = (counters[key] || 0) + 1;
    return `${getTypePrefix(key)}${counters[key]}`;
  });
}

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
  const t = useTranslations("courseBuilder");
  const { fields, append, remove } = useFieldArray({
    control,
    name: `units.${moduleIndex}.subUnit`,
  });

  const watchedTopics = useWatch({
    control,
    name: `units.${moduleIndex}.subUnit`,
    defaultValue: topics,
  });

  const typeSignature = Array.isArray(watchedTopics)
    ? watchedTopics.map((topic: any) => topic?.type || "Behaviour").join("|")
    : "";

  // Keep Sr No. in sync when rows are added/removed or type changes
  useEffect(() => {
    if (!setValue || !Array.isArray(watchedTopics) || watchedTopics.length === 0) {
      return;
    }

    const codes = buildStandardSrNos(watchedTopics);
    codes.forEach((code, index) => {
      if (watchedTopics[index]?.code !== code) {
        setValue(`units.${moduleIndex}.subUnit.${index}.code` as any, code, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length, typeSignature, moduleIndex, setValue]);

  const handleAddTopic = () => {
    const current = Array.isArray(watchedTopics) ? watchedTopics : [];
    const defaultType: CriterionType = "Knowledge";
    const nextCode =
      buildStandardSrNos([...current, { type: defaultType }]).at(-1) || "K1";

    const newTopic = {
      id: Date.now(),
      title: "",
      type: defaultType,
      code: nextCode,
    };
    append(newTopic, { shouldFocus: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {topics.length > 0
            ? t("course.standard.assessmentCriteriaCount", { count: topics.length })
            : t("course.standard.assessmentCriteria")}
        </h4>
        {!readOnly && (
          <Button onClick={handleAddTopic} size="sm" className="gap-2" type="button">
            <Plus className="h-4 w-4" />
            {t("course.standard.addAssessmentCriteria")}
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
                    {t("course.standard.type")} <span className="text-destructive">*</span>
                  </TableHead>
                  <TableHead>{t("course.standard.srNo")}</TableHead>
                  <TableHead>
                    {t("course.standard.title")} <span className="text-destructive">*</span>
                  </TableHead>
                  {!readOnly && (
                    <TableHead className="w-[100px] text-center">{t("course.gateway.actions")}</TableHead>
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
                                value={formField.value || "Knowledge"}
                                onValueChange={formField.onChange}
                                disabled={readOnly}
                              >
                                <SelectTrigger className={cn("w-[150px]", error && "border-destructive")}>
                                  <SelectValue placeholder={t("course.standard.placeholderSelectType")} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Behaviour">{t("course.standard.typeBehaviour")}</SelectItem>
                                  <SelectItem value="Knowledge">{t("course.standard.typeKnowledge")}</SelectItem>
                                  <SelectItem value="Skills">{t("course.standard.typeSkills")}</SelectItem>
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
                          name={`units.${moduleIndex}.subUnit.${index}.code`}
                          control={control}
                          render={({ field: formField }) => (
                            <Input
                              {...formField}
                              value={
                                formField.value ||
                                buildStandardSrNos(
                                  Array.isArray(watchedTopics) ? watchedTopics : []
                                )[index] ||
                                ""
                              }
                              placeholder={t("course.standard.placeholderSrNo")}
                              className="w-[100px]"
                              disabled={readOnly}
                            />
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
                                placeholder={t("course.standard.placeholderTopicTitle")}
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
