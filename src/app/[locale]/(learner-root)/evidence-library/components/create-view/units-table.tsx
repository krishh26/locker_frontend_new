/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Controller, Control, FieldError, useWatch, type UseFormSetValue } from "react-hook-form";
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
import { Accordion } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import {
  UnitAccordionItem,
  UnitHierarchyHeader,
} from "@/components/unit-hierarchy-accordion";
import { useTranslations } from "next-intl";
import type { EvidenceFormValues } from "./evidence-form-types";
import { resolveFormErrorMessage } from "./evidence-form-types";
import { GapIndicator } from "../gap-indicator";
import { EvidenceIndicator } from "../evidence-indicator";
import { UnitSubUnitTitle } from "../unit-sub-unit-title";
import {
  buildStandardCriteriaCodes,
  getStandardUnitParts,
} from "@/utils/unit-labels";
import { COURSE_TYPES } from "../constants";

/** Compact columns for evidence create Unit Mappings. */
const LEARNER_MAP_COL_CLASS =
  "w-28 min-w-28 max-w-28 whitespace-normal align-middle";
const UNIT_TITLE_HEAD_CLASS =
  "min-w-56 max-w-80 w-[40%] whitespace-normal";
const UNIT_TITLE_CELL_CLASS =
  "min-w-56 max-w-80 w-[40%] align-top whitespace-normal";

/** One mappable row: a sub-unit, or a unit that has no sub-units. */
type MappingRow = {
  key: string;
  courseId: number;
  unit: any;
  unitIndex: number;
  subUnit?: any;
  subIndex?: number;
  code: string;
};

interface UnitsTableProps {
  control: Control<EvidenceFormValues>;
  setValue: UseFormSetValue<EvidenceFormValues>;
  courses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: any[];
  }>;
  disabled?: boolean;
  canEditLearnerFields?: boolean;
  canEditTrainerFields?: boolean;
  error?: FieldError;
  getEvidenceCount?: (
    courseId: string | number,
    unitId: string | number,
    topicId?: string | number,
  ) => number;
}

export function UnitsTable({
  control,
  setValue,
  courses,
  disabled,
  canEditLearnerFields = true,
  canEditTrainerFields = false,
  error,
  getEvidenceCount,
}: UnitsTableProps) {
  const t = useTranslations("evidenceLibrary");
  const unitsErrorMessage = resolveFormErrorMessage(error);
  const isStandardUnitsError =
    unitsErrorMessage === "form.validation.learnerMapRequiredStandard";

  const handleTrainerGapClick = (
    trainerMapField: { value?: boolean; onChange: (value: boolean) => void },
    learnerMapPath: string,
    signedOffPath: string,
  ) => {
    if (disabled || !canEditTrainerFields) return;
    const turningOn = !trainerMapField.value;
    trainerMapField.onChange(turningOn);
    if (turningOn) {
      setValue(learnerMapPath as any, true);
    } else {
      setValue(signedOffPath as any, false);
    }
  };
  // Always call hooks first - before any conditional returns
  const watchedUnits = useWatch({ control, name: "units" });
  const courseSelectedTypes = useWatch({ control, name: "courseSelectedTypes" }) || {};
  const units = useMemo<any[]>(() => (watchedUnits as any[]) || [], [watchedUnits]);

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
      const key = `${unit.course_id}-${unit.id}-${unit.type ?? ""}`;
      map.set(key, index);
    });
    return map;
  }, [units]);

  // Find unit index by id and course_id - use stable mapping
  const findUnitIndex = (unitId: string | number, courseId: number, unitType?: string) => {
    const key = `${courseId}-${unitId}-${unitType ?? ""}`;
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

  /** Flattens a course into mappable rows, skipping anything not in form state. */
  const collectCourseRows = (course: any, courseUnits: any[]): MappingRow[] => {
    const criteriaCode = buildStandardCriteriaCodes(courseUnits);
    const rows: MappingRow[] = [];

    courseUnits.forEach((unit: any) => {
      const unitIndex = findUnitIndex(unit.id, course.course_id, unit.type);
      if (unitIndex === -1) return;

      const subUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];
      if (subUnits.length > 0) {
        subUnits.forEach((subUnit: any) => {
          const subIndex = findSubUnitIndex(unitIndex, subUnit.id);
          if (subIndex === -1) return;

          rows.push({
            key: `${course.course_id}-${unit.id}-${subUnit.id}`,
            courseId: course.course_id,
            unit,
            unitIndex,
            subUnit,
            subIndex,
            code: criteriaCode(unit.id, subUnit.id),
          });
        });
        return;
      }

      rows.push({
        key: `${course.course_id}-${unit.id}-${unit.type ?? ""}`,
        courseId: course.course_id,
        unit,
        unitIndex,
        code: criteriaCode(unit.id, unit.id),
      });
    });

    return rows;
  };

  const mappingHeader = (
    <TableRow>
      <TableHead className={LEARNER_MAP_COL_CLASS}>Learner Map</TableHead>
      <TableHead className={UNIT_TITLE_HEAD_CLASS}>Unit/Sub Unit</TableHead>
      <TableHead>Trainer Comment</TableHead>
      <TableHead className="text-center">Gap</TableHead>
      <TableHead className="text-center">Signed Off</TableHead>
    </TableRow>
  );

  /** Sub-units and bare units only differ by the form path they write to. */
  const renderMappingRow = (row: MappingRow) => {
    const isSubUnitRow = row.subUnit != null;
    const path = isSubUnitRow
      ? `units.${row.unitIndex}.subUnit.${row.subIndex}`
      : `units.${row.unitIndex}`;
    const live = isSubUnitRow
      ? (units?.[row.unitIndex] as any)?.subUnit?.[row.subIndex as number]
      : (units?.[row.unitIndex] as any);

    return (
      <TableRow key={row.key}>
        <TableCell className={LEARNER_MAP_COL_CLASS}>
          <Controller
            key={`${row.key}-learnerMap`}
            name={`${path}.learnerMap` as any}
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
                disabled={disabled || !canEditLearnerFields}
              />
            )}
          />
        </TableCell>
        <TableCell className={UNIT_TITLE_CELL_CLASS}>
          <UnitSubUnitTitle
            code={row.code}
            title={isSubUnitRow ? row.subUnit.title : row.unit.title}
          />
        </TableCell>
        <TableCell>
          <Controller
            key={`${row.key}-comment`}
            name={`${path}.comment` as any}
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t("unitsTable.trainerCommentPlaceholder")}
                disabled={disabled || !canEditTrainerFields}
                className="w-full"
              />
            )}
          />
        </TableCell>
        <TableCell className="text-center">
          <div className="flex flex-col items-center">
            <Controller
              key={`${row.key}-trainerMap`}
              name={`${path}.trainerMap` as any}
              control={control}
              render={({ field: trainerMapField }) => (
                <GapIndicator
                  learnerMap={live?.learnerMap || false}
                  trainerMap={trainerMapField.value || false}
                  signed_off={live?.signed_off || false}
                  disabled={disabled || !canEditTrainerFields}
                  onClick={() => {
                    handleTrainerGapClick(
                      trainerMapField,
                      `${path}.learnerMap`,
                      `${path}.signed_off`,
                    );
                  }}
                />
              )}
            />
            <EvidenceIndicator
              evidenceCount={
                getEvidenceCount
                  ? getEvidenceCount(row.courseId, row.unit.id, row.subUnit?.id)
                  : 0
              }
            />
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Controller
            key={`${row.key}-signed_off`}
            name={`${path}.signed_off` as any}
            control={control}
            render={({ field }) => (
              <Checkbox
                checked={field.value || false}
                onCheckedChange={field.onChange}
                disabled={
                  disabled ||
                  !canEditTrainerFields ||
                  !live?.learnerMap ||
                  !live?.trainerMap
                }
              />
            )}
          />
        </TableCell>
      </TableRow>
    );
  };

  // Early return AFTER all hooks are called
  if (!units || units.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("courseSelection.selectCourses")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.values(unitsByCourse).map(({ course, units: courseUnits }) => {
        const isStandardCourse = course.course_core_type === COURSE_TYPES.STANDARD;
        const rows = collectCourseRows(course, courseUnits);

        if (isStandardCourse) {
          // Standard form units are stored per (unit, type) pair, so regroup
          // them into the Duty -> criteria hierarchy Gap Analysis uses. Each
          // row carries its own "K1"/"B1"/"S1" code, so the types stay legible
          // without a level of their own.
          const dutyGroups = new Map<string, { unit: any; rows: MappingRow[] }>();

          rows.forEach((row) => {
            const dutyKey = String(row.unit.id);
            if (!dutyGroups.has(dutyKey)) {
              dutyGroups.set(dutyKey, { unit: row.unit, rows: [] });
            }
            dutyGroups.get(dutyKey)!.rows.push(row);
          });

          // A type spans several Duties, so the learner-map error belongs to the
          // course rather than to any single Duty.
          const selectedTypes = courseSelectedTypes[course.course_id] || [];
          const typesMissingLearnerMap = selectedTypes.filter(
            (type) =>
              !rows.some(
                (row) =>
                  String(row.unit.type || "") === String(type) &&
                  (row.subUnit ?? row.unit).learnerMap === true,
              ),
          );

          return (
            <div key={course.course_id} className="space-y-3 mb-4 min-w-0">
              <h3 className="font-semibold text-lg mb-2">
                {course.course_name} - Units
              </h3>
              <UnitHierarchyHeader unitLabel="Unit" titleLabel="Title" />
              <Accordion
                type="multiple"
                defaultValue={[]}
                className="w-full min-w-0 space-y-3"
              >
                {Array.from(dutyGroups.values()).map(
                  ({ unit, rows: dutyRows }, dutyOrder) => {
                    if (dutyRows.length === 0) return null;

                    const unitParts = getStandardUnitParts(
                      unit,
                      "Untitled module",
                      dutyOrder,
                    );
                    const dutyHasError =
                      isStandardUnitsError &&
                      dutyRows.some((row) =>
                        typesMissingLearnerMap.includes(
                          String(row.unit.type || ""),
                        ),
                      );

                    return (
                      <UnitAccordionItem
                        key={`${course.course_id}-${unit.id}`}
                        value={`unit-${course.course_id}-${unit.id}`}
                        unitLabel={unitParts.unitLabel}
                        titleLabel={unitParts.titleLabel}
                      >
                        <div className="overflow-x-auto pt-3">
                          <Table>
                            <TableHeader>{mappingHeader}</TableHeader>
                            <TableBody>
                              {dutyRows.map(renderMappingRow)}
                            </TableBody>
                          </Table>
                        </div>
                        {dutyHasError && unitsErrorMessage && (
                          <p className="mt-2 text-sm text-destructive font-medium">
                            {t(unitsErrorMessage)}
                          </p>
                        )}
                      </UnitAccordionItem>
                    );
                  },
                )}
              </Accordion>
            </div>
          );
        }

        // For non-Standard courses, show units as before
        return (
          <Card key={course.course_id} className="p-4">
            <h3 className="font-semibold mb-4">{course.course_name}</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>{mappingHeader}</TableHeader>
                <TableBody>{rows.map(renderMappingRow)}</TableBody>
              </Table>
            </div>
          </Card>
        );
      })}
      {isStandardUnitsError && unitsErrorMessage && (
        <p className="text-sm text-destructive">{t(unitsErrorMessage)}</p>
      )}
    </div>
  );
}
