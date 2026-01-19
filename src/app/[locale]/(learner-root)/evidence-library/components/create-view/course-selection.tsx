/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useCallback } from "react";
import { Controller, Control, FieldError, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import type { EvidenceFormValues } from "./evidence-form-types";
import type { LearnerCourse } from "@/store/api/learner/types";
import { COURSE_TYPES } from "../constants";

const UNIT_TYPES = {
  KNOWLEDGE: "Knowledge",
  BEHAVIOUR: "Behaviour",
  SKILLS: "Skills",
} as const;

interface CourseSelectionProps {
  control: Control<EvidenceFormValues>;
  courses: LearnerCourse[];
  disabled?: boolean;
  error?: FieldError;
  courseSelectedTypesError?: FieldError;
  unitsError?: FieldError;
  setValue: (name: keyof EvidenceFormValues, value: unknown) => void;
  getValues: () => EvidenceFormValues;
}

export function CourseSelection({
  control,
  courses,
  disabled,
  error,
  courseSelectedTypesError,
  unitsError,
  setValue,
  getValues,
}: CourseSelectionProps) {
  const selectedCourses = useWatch({ control, name: "selectedCourses" });
  const courseSelectedTypes = useWatch({ control, name: "courseSelectedTypes" }) || {};
  const units = useWatch({ control, name: "units" }) || [];

  // Memoize selectedCourses to avoid dependency issues
  const memoizedSelectedCourses = useMemo(() => {
    return (selectedCourses || []) as Array<{
      course_id: number;
      course_name: string;
      course_code: string;
      course_core_type?: string;
      units?: Array<{ id?: number | string; title?: string; type?: string; code?: string; subUnit?: Array<{ id?: number | string; title?: string }> }>;
    }>;
  }, [selectedCourses]);

  // Transform courses to options (filter out Gateway courses)
  const courseOptions = useMemo(() => {
    return courses
      .map((courseItem) => {
        const course = courseItem.course || courseItem;
        if (course?.course_id && course.course_core_type !== COURSE_TYPES.GATEWAY) {
          // Type assertion for units - they may exist in the course structure
          const courseWithStructure = course as typeof course & { 
            units?: Array<{ id?: number | string; title?: string; type?: string; code?: string; subUnit?: any[] }>;
          };
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
            course_core_type: course.course_core_type,
            units: courseWithStructure.units || [],
          };
        }
        return null;
      })
      .filter((course): course is NonNullable<typeof course> => course !== null)
      .sort((a, b) => a.course_name.localeCompare(b.course_name));
  }, [courses]);

  // Handle course selection
  const handleCourseAdd = useCallback((courseId: string) => {
    const selectedCourse = courseOptions.find(
      (c) => String(c.course_id) === courseId
    );
    if (!selectedCourse) return;

    const currentSelected = getValues().selectedCourses || [];
    if (
      currentSelected.some((c) => c.course_id === selectedCourse.course_id)
    ) {
      return;
    }

    const updated = [...currentSelected, selectedCourse];
    setValue("selectedCourses", updated);

    // Initialize type selection for Standard courses
    if (selectedCourse.course_core_type === COURSE_TYPES.STANDARD) {
      const currentTypes = getValues().courseSelectedTypes || {};
      setValue("courseSelectedTypes", {
        ...currentTypes,
        [selectedCourse.course_id]: [],
      });
    }

    // Qualification courses are handled via unit selection (handleUnitToggle)
    // No initialization needed here - units are added when user selects them
  }, [courseOptions, getValues, setValue]);

  // Handle course removal
  const handleCourseRemove = useCallback((courseId: number) => {
    const currentSelected = getValues().selectedCourses || [];
    const updated = currentSelected.filter((c: any) => c.course_id !== courseId);
    setValue("selectedCourses", updated);

    // Remove type selection
    const currentTypes = getValues().courseSelectedTypes || {};
    const updatedTypes = { ...currentTypes };
    delete updatedTypes[courseId];
    setValue("courseSelectedTypes", updatedTypes);

    // Remove units for this course
    const currentUnits = getValues().units || [];
    const updatedUnits = currentUnits.filter((u: any) => {
      // Remove if it's a unit with matching course_id
      if (u.course_id === courseId) {
        return false;
      }
      return true;
    });
    setValue("units", updatedUnits);
  }, [getValues, setValue]);

  // Handle type toggle for Standard courses (multiple selection)
  const handleTypeToggle = useCallback((courseId: number, type: string, checked: boolean) => {
    const currentTypes = getValues().courseSelectedTypes || {};
    const selectedTypes = currentTypes[courseId] || [];
    
    if (checked) {
      // Add type to array
      setValue("courseSelectedTypes", {
        ...currentTypes,
        [courseId]: [...selectedTypes, type],
      });

      // Initialize units for this type
      const course = memoizedSelectedCourses.find((c) => c.course_id === courseId);
      if (!course) return;

      const courseUnits = course.units || [];
      const filteredUnits = courseUnits.filter((u: any) => u.type === type);

      // Remove existing units of this type (to avoid duplicates)
      const currentUnits = getValues().units || [];
      const unitsToKeep = currentUnits.filter(
        (u: any) => !(u.course_id === courseId && u.type === type)
      );

      // Initialize new units
      const initializedUnits = filteredUnits.map((unit) => {
        const hasSubUnit = unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0;
        return {
          ...unit,
          course_id: courseId,
          type: unit.type,
          code: unit.code,
          learnerMap: false,
          trainerMap: false,
          signedOff: false,
          comment: "",
          subUnit: hasSubUnit && unit.subUnit
            ? unit.subUnit.map((sub: any) => ({
                ...sub,
                // Preserve topics array if it exists
                topics: sub.topics ? sub.topics.map((topic: any) => ({
                  ...topic,
                  learnerMap: topic.learnerMap ?? false,
                  trainerMap: topic.trainerMap ?? false,
                  signedOff: topic.signedOff ?? false,
                  comment: topic.comment ?? "",
                })) : undefined,
                learnerMap: false,
                trainerMap: false,
                signedOff: false,
                comment: "",
              }))
            : [],
        };
      });

      setValue("units", [...unitsToKeep, ...initializedUnits]);
    } else {
      // Remove type from array
      setValue("courseSelectedTypes", {
        ...currentTypes,
        [courseId]: selectedTypes.filter((t) => t !== type),
      });

      // Remove ALL units of this type
      const currentUnits = getValues().units || [];
      const updatedUnits = currentUnits.filter(
        (u: any) => !(u.course_id === courseId && u.type === type)
      );
      setValue("units", updatedUnits);
    }
  }, [memoizedSelectedCourses, getValues, setValue]);

  // Handle unit selection for Qualification courses
  const handleUnitToggle = useCallback((courseId: number, unit: any, checked: boolean) => {
    const currentUnits = getValues().units || [];
    
    if (checked) {
      // Try to get the full unit structure from original courses prop to ensure we have all properties including topics
      const originalCourse = courses.find((courseItem: any) => {
        const course = courseItem.course || courseItem;
        return course?.course_id === courseId;
      });
      const originalCourseData = (originalCourse?.course || originalCourse) as any;
      const fullUnit = originalCourseData?.units?.find((u: any) => String(u.id) === String(unit.id)) || unit;
      
      // Add unit - preserve all properties including nested topics
      // Use deep clone to ensure all nested properties (especially topics) are preserved
      const unitToAdd = JSON.parse(JSON.stringify(fullUnit));
      unitToAdd.course_id = courseId;
      
      // Ensure mapping properties are initialized
      unitToAdd.learnerMap = fullUnit.learnerMap ?? false;
      unitToAdd.trainerMap = fullUnit.trainerMap ?? false;
      unitToAdd.signedOff = fullUnit.signedOff ?? false;
      unitToAdd.comment = fullUnit.comment ?? "";
      
      // Ensure subUnit topics have proper initialization
      if (unitToAdd.subUnit && Array.isArray(unitToAdd.subUnit)) {
        unitToAdd.subUnit = unitToAdd.subUnit.map((sub: any) => {
          // Initialize mapping properties for subUnit
          sub.learnerMap = sub.learnerMap ?? false;
          sub.trainerMap = sub.trainerMap ?? false;
          sub.signedOff = sub.signedOff ?? false;
          sub.comment = sub.comment ?? "";
          
          // Ensure topics array is preserved and initialized
          if (sub.topics && Array.isArray(sub.topics)) {
            sub.topics = sub.topics.map((topic: any) => ({
              ...topic,
              learnerMap: topic.learnerMap ?? false,
              trainerMap: topic.trainerMap ?? false,
              signedOff: topic.signedOff ?? false,
              comment: topic.comment ?? "",
            }));
          }
          
          return sub;
        });
      }
      setValue("units", [...currentUnits, unitToAdd]);
    } else {
      // Remove unit
      const updated = currentUnits.filter(
        (u) => !(String(u.id) === String(unit.id) && u.course_id === courseId)
      );
      setValue("units", updated);
    }
  }, [getValues, setValue, courses]);

  return (
    <Controller
      name="selectedCourses"
      control={control}
      render={() => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Select Courses <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-3">
              {/* Selected Courses Display */}
              {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCourses.map((course: any) => (
                    <Badge
                      key={course.course_id}
                      variant="secondary"
                      className="px-3 py-1.5 text-sm"
                    >
                      {course.course_name} ({course.course_code})
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-0 hover:bg-transparent"
                          onClick={() => handleCourseRemove(course.course_id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Course Selector */}
              {!disabled && (
                <Select value="" onValueChange={handleCourseAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions
                      .filter(
                        (course) =>
                          !selectedCourses.some(
                            (c: any) => c.course_id === course.course_id
                          )
                      )
                      .map((course) => (
                        <SelectItem
                          key={course.course_id}
                          value={String(course.course_id)}
                        >
                          {course.course_name} ({course.course_code}) -{" "}
                          {course.course_core_type}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              {error && (
                <p className="text-sm text-destructive">{error.message}</p>
              )}
            </div>
          </div>

           {/* Type Selection for Standard Courses */}
           {memoizedSelectedCourses
             .filter((course) => course.course_core_type === COURSE_TYPES.STANDARD)
             .map((course) => {
               const selectedTypes = courseSelectedTypes[course.course_id] || [];
               // Show error only if there's a validation error AND this specific course has no types selected
               const hasError = courseSelectedTypesError && (!Array.isArray(selectedTypes) || selectedTypes.length === 0);
               return (
                 <Card key={course.course_id} className={`p-4 ${hasError ? 'border-destructive border-2' : ''}`}>
                   <Label className="text-base font-semibold mb-3 block">
                     {course.course_name} - Select Type:
                     <span className="text-destructive ml-1">*</span>
                   </Label>
                   <div className={`flex flex-wrap gap-4 ${hasError ? 'mb-2' : ''}`}>
                     {Object.values(UNIT_TYPES).map((type) => {
                       const isSelected = selectedTypes.includes(type);
                       return (
                         <div key={type} className="flex items-center space-x-2">
                           <Checkbox
                             id={`${course.course_id}-${type}`}
                             checked={isSelected}
                             onCheckedChange={(checked) =>
                               handleTypeToggle(course.course_id, type, checked as boolean)
                             }
                             disabled={disabled}
                           />
                           <Label htmlFor={`${course.course_id}-${type}`} className="cursor-pointer">
                             {type}
                           </Label>
                         </div>
                       );
                     })}
                   </div>
                   {hasError && (
                     <div className="mt-2">
                       <p className="text-sm text-destructive font-medium">
                         {courseSelectedTypesError?.message || `Please select at least one type (Knowledge, Behaviour, or Skills) for ${course.course_name}`}
                       </p>
                     </div>
                   )}
                 </Card>
               );
             })}

          {/* Unit Selection for Qualification Courses */}
          {memoizedSelectedCourses
            .filter((course) => course.course_core_type === COURSE_TYPES.QUALIFICATION)
            .map((course) => {
              const courseUnits = units.filter(
                (u) => u.course_id === course.course_id
              );
              const hasSelectedUnits = courseUnits.length > 0;
              return (
                <Card key={course.course_id} className="p-4">
                  <Label className="text-base font-semibold mb-3 block">
                    {course.course_name} - Select Units:
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <div className="space-y-2">
                    {course.units?.map((unit) => {
                      const isSelected = units.some(
                        (u) =>
                          String(u.id) === String(unit.id) &&
                          u.course_id === course.course_id
                      );
                      const checkboxId = `unit-${course.course_id}-${unit.id}`;
                      return (
                        <div key={unit.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={checkboxId}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleUnitToggle(course.course_id, unit, checked as boolean)
                            }
                            disabled={disabled}
                          />
                          <Label htmlFor={checkboxId} className="cursor-pointer">
                            {unit.title}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {unitsError && !hasSelectedUnits && (
                    <p className="text-sm text-destructive mt-2">
                      Please select at least one unit for {course.course_name}
                    </p>
                  )}
                </Card>
              );
            })}
        </div>
      )}
    />
  );
}
