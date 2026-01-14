/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CourseUnitsModulesStep Component
 * 
 * Step component for managing units/modules for Qualification and Standard courses
 * Qualification: Units with assessment criteria
 * Standard: Modules with topics
 */

"use client";

import React from "react";
import { Control, FieldErrors } from "react-hook-form";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { StandardModulesStep } from "./standard-components/standard-modules-step";
import { QualificationUnitsModulesStep } from "./qualification-components/qualification-units-modules-step";

interface CourseUnitsModulesStepProps {
  courseId?: string | number | null;
  courseCoreType: CourseCoreType;
  control: Control<CourseFormData>;
  setValue: (name: string, value: any) => void;
  errors?: FieldErrors<CourseFormData>;
}

export function CourseUnitsModulesStep({
  courseId,
  courseCoreType,
  control,
  setValue,
  errors,
}: CourseUnitsModulesStepProps) {
  // Gateway courses don't have units/modules
  if (courseCoreType === "Gateway") {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          Gateway courses do not have units or modules.
        </p>
      </div>
    );
  }

  // Qualification - Units
  if (courseCoreType === "Qualification") {
    return (
      <div className="space-y-4">
        <QualificationUnitsModulesStep
          courseId={courseId}
          courseCoreType={courseCoreType}
          control={control}
          setValue={setValue}
          errors={errors}
        />
      </div>
    );
  }

  // Standard - Modules
  return (
    <div className="space-y-4">
      <StandardModulesStep
        courseId={courseId}
        courseCoreType={courseCoreType}
        control={control}
        setValue={setValue}
        errors={errors}
      />
    </div>
  );
}
