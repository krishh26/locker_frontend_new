/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useCallback } from "react";
import { Control, UseFormSetValue, UseFormTrigger, useWatch } from "react-hook-form";
import type { EvidenceEntry } from "@/store/api/evidence/types";
import type { LearnerCourse } from "@/store/api/learner/types";
import { COURSE_TYPES } from "../constants";
import { reconstructFormStateFromMappings } from "../../utils/reconstruct-form-state";
import { QualificationMinimal } from "./qualification-minimal";
import { StandardCourseMinimal } from "./standard-course-minimal";

interface EvidenceMappingsTableProps {
  control: Control<any>;
  evidence: EvidenceEntry;
  courses: LearnerCourse[];
  setValue: UseFormSetValue<any>;
  trigger: UseFormTrigger<any>;
  canEditLearnerFields?: boolean;
  canEditTrainerFields?: boolean;
  getEvidenceCount?: (courseId: string | number, unitId: string | number, topicId?: string | number) => number;
}

export function EvidenceMappingsTable({
  control,
  evidence,
  courses,
  setValue,
  trigger,
  canEditLearnerFields = true,
  canEditTrainerFields = true,
  getEvidenceCount = () => 0,
}: EvidenceMappingsTableProps) {
  // Get units from form state (includes newly selected units)
  const watchedUnits = useWatch({ control, name: "units" });
  const formUnits = useMemo(() => watchedUnits || [], [watchedUnits]);
  const unitsWatch = formUnits;
  
  // Reconstruct units from mappings (for selectedCourses)
  const reconstructedData = useMemo(() => {
    if (evidence.mappings && evidence.mappings.length > 0 && courses.length > 0) {
      return reconstructFormStateFromMappings(evidence.mappings, courses);
    }
    return { selectedCourses: [], courseSelectedTypes: {}, units: [] };
  }, [evidence.mappings, courses]);

  // Use form units if available, otherwise use reconstructed units
  const units = useMemo(() => {
    return formUnits.length > 0 ? formUnits : (reconstructedData.units || []);
  }, [formUnits, reconstructedData.units]);
  const selectedCourses = useMemo(() => {
    // If we have form units, find courses from those units
    if (formUnits.length > 0) {
      const courseIds = new Set(formUnits.map((u: any) => u.course_id).filter(Boolean));
      return courses
        .filter((courseItem: any) => {
          const course = courseItem.course || courseItem;
          return course && courseIds.has(course.course_id);
        })
        .map((courseItem: any) => {
          const course = courseItem.course || courseItem;
          return {
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
            course_core_type: course.course_core_type,
            units: course.units || [],
          };
        });
    }
    return reconstructedData.selectedCourses || [];
  }, [formUnits, courses, reconstructedData.selectedCourses]);

  // Create stable index mapping
  const unitIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    units.forEach((unit: any, index: number) => {
      const key = `${unit.course_id}-${unit.id}`;
      map.set(key, index);
    });
    return map;
  }, [units]);

  const findUnitIndex = (unitId: string | number, courseId: number) => {
    const key = `${courseId}-${unitId}`;
    return unitIndexMap.get(key) ?? -1;
  };

  const findSubUnitIndex = (unitIndex: number, subUnitId: string | number) => {
    const unit = units[unitIndex] as any;
    if (!unit?.subUnit) return -1;
    return unit.subUnit.findIndex(
      (s: any) => String(s.id) === String(subUnitId)
    );
  };

  const findTopicIndex = (
    unitIndex: number,
    subUnitIndex: number,
    topicId: string | number
  ) => {
    const unit = units[unitIndex] as any;
    if (!unit?.subUnit?.[subUnitIndex]?.topics) return -1;
    return unit.subUnit[subUnitIndex].topics.findIndex(
      (t: any) => String(t.id) === String(topicId)
    );
  };

  // Qualification handlers
  const qualificationLearnerMapHandler = useCallback((topic: any, unitId: string | number, subUnitId: string | number) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(unitId));
    if (unit && unit.subUnit) {
      const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(subUnitId));
      if (subUnit && subUnit.topics) {
        const topicItem = subUnit.topics.find((t: any) => String(t.id) === String(topic.id));
        if (topicItem) {
          topicItem.learnerMap = !topicItem.learnerMap;
          setValue('units', updated);
          trigger('units');
        }
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const qualificationTrainerMapHandler = useCallback((topic: any, unitId: string | number, subUnitId: string | number) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(unitId));
    if (unit && unit.subUnit) {
      const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(subUnitId));
      if (subUnit && subUnit.topics) {
        const topicItem = subUnit.topics.find((t: any) => String(t.id) === String(topic.id));
        if (topicItem) {
          topicItem.trainerMap = !topicItem.trainerMap;
          setValue('units', updated);
          trigger('units');
        }
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const qualificationSignedOffHandler = useCallback((topic: any, unitId: string | number, subUnitId: string | number) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(unitId));
    if (unit && unit.subUnit) {
      const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(subUnitId));
      if (subUnit && subUnit.topics) {
        const topicItem = subUnit.topics.find((t: any) => String(t.id) === String(topic.id));
        if (topicItem) {
          topicItem.signedOff = !topicItem.signedOff;
          setValue('units', updated);
          trigger('units');
        }
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const qualificationCommentHandler = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, topicId: string | number, unitId: string | number, subUnitId: string | number) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(unitId));
    if (unit && unit.subUnit) {
      const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(subUnitId));
      if (subUnit && subUnit.topics) {
        const topicItem = subUnit.topics.find((t: any) => String(t.id) === String(topicId));
        if (topicItem) {
          topicItem.comment = e.target.value;
          setValue('units', updated);
          trigger('units');
        }
      }
    }
  }, [unitsWatch, setValue, trigger]);

  // Standard course handlers
  const standardLearnerMapHandler = useCallback((row: any) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(row.unitId));
    if (unit) {
      const hasSubUnit = unit.subUnit && unit.subUnit.length > 0;
      if (hasSubUnit) {
        const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(row.id));
        if (subUnit) {
          subUnit.learnerMap = !subUnit.learnerMap;
          setValue('units', updated);
          trigger('units');
        }
      } else {
        unit.learnerMap = !unit.learnerMap;
        setValue('units', updated);
        trigger('units');
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const standardTrainerMapHandler = useCallback((row: any) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(row.unitId));
    if (unit) {
      const hasSubUnit = unit.subUnit && unit.subUnit.length > 0;
      if (hasSubUnit) {
        const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(row.id));
        if (subUnit) {
          subUnit.trainerMap = !subUnit.trainerMap;
          setValue('units', updated);
          trigger('units');
        }
      } else {
        unit.trainerMap = !unit.trainerMap;
        setValue('units', updated);
        trigger('units');
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const standardSignedOffHandler = useCallback((row: any) => {
    const updated = [...unitsWatch];
    const unit = updated.find((u: any) => String(u.id) === String(row.unitId));
    if (unit) {
      const hasSubUnit = unit.subUnit && unit.subUnit.length > 0;
      if (hasSubUnit) {
        const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(row.id));
        if (subUnit) {
          subUnit.signedOff = !subUnit.signedOff;
          setValue('units', updated);
          trigger('units');
        }
      } else {
        unit.signedOff = !unit.signedOff;
        setValue('units', updated);
        trigger('units');
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const standardCommentHandler = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, id: string | number) => {
    const updated = [...unitsWatch];
    // Find the row by id (could be unit or subUnit)
    // The id could be either the unitId or the subUnit id depending on the row structure
    for (const unit of updated) {
      // Check if this is a unit-level row (no subUnit)
      if (String(unit.id) === String(id) && (!unit.subUnit || unit.subUnit.length === 0)) {
        unit.comment = e.target.value;
        setValue('units', updated);
        trigger('units');
        return;
      }
      // Check if this is a subUnit row
      if (unit.subUnit) {
        const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(id));
        if (subUnit) {
          subUnit.comment = e.target.value;
          setValue('units', updated);
          trigger('units');
          return;
        }
      }
    }
  }, [unitsWatch, setValue, trigger]);

  const selectAllSignedOffForCombinedHandler = useCallback((combinedSubUnits: any[], checked: boolean) => {
    const updated = [...unitsWatch];
    combinedSubUnits.forEach((row) => {
      const unit = updated.find((u: any) => String(u.id) === String(row.unitId));
      if (unit) {
        const hasSubUnit = unit.subUnit && unit.subUnit.length > 0;
        if (hasSubUnit) {
          const subUnit = unit.subUnit.find((s: any) => String(s.id) === String(row.id));
          if (subUnit && subUnit.learnerMap && subUnit.trainerMap) {
            subUnit.signedOff = checked;
          }
        } else {
          if (unit.learnerMap && unit.trainerMap) {
            unit.signedOff = checked;
          }
        }
      }
    });
    setValue('units', updated);
    trigger('units');
  }, [unitsWatch, setValue, trigger]);

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No unit mappings found
      </div>
    );
  }

  // Separate Qualification and Standard courses
  const qualificationCourses = selectedCourses.filter(
    (c: any) => c.course_core_type === COURSE_TYPES.QUALIFICATION
  );
  const standardCourses = selectedCourses.filter(
    (c: any) => c.course_core_type === COURSE_TYPES.STANDARD
  );

  return (
    <div className="space-y-4">
      {/* Qualification Courses */}
      {qualificationCourses.map((course: any) => {
        const courseUnits = units.filter(
          (u: any) => u.course_id === course.course_id
        );

        if (courseUnits.length === 0) return null;

        return (
          <div key={course.course_id} className="space-y-4 mb-4">
            <h3 className="font-semibold text-lg mb-2">
              {course.course_name} - Units
            </h3>
            {courseUnits.map((unit: any) => {
              return (
                <QualificationMinimal
                  key={unit.id}
                  unit={unit}
                  courseId={course.course_id}
                  findUnitIndex={findUnitIndex}
                  findSubUnitIndex={findSubUnitIndex}
                  findTopicIndex={findTopicIndex}
                  setValue={setValue}
                  unitsWatch={unitsWatch}
                  learnerMapHandler={qualificationLearnerMapHandler}
                  trainerMapHandler={qualificationTrainerMapHandler}
                  signedOffHandler={qualificationSignedOffHandler}
                  commentHandler={qualificationCommentHandler}
                  getEvidenceCount={getEvidenceCount}
                  canEditLearnerFields={canEditLearnerFields}
                  canEditTrainerFields={canEditTrainerFields}
                />
              );
            })}
          </div>
        );
      })}

      {/* Standard Courses */}
      {standardCourses.map((course: any) => {
        const courseUnits = units.filter(
          (u: any) => u.course_id === course.course_id
        );

        if (courseUnits.length === 0) return null;

        // Group units by type
        const unitsByType = new Map<string, typeof courseUnits>();
        courseUnits.forEach((unit: any) => {
          const unitType = unit.type || '';
          if (!unitsByType.has(unitType)) {
            unitsByType.set(unitType, []);
          }
          unitsByType.get(unitType)!.push(unit);
        });

        return (
          <div key={course.course_id} className="space-y-4">
            {Array.from(unitsByType.entries()).map(([unitType, unitsOfType]) => {
              // Combine all subUnits from all units of this type
              const combinedSubUnits: any[] = [];
              unitsOfType.forEach((unit: any) => {
                const unitIndex = findUnitIndex(unit.id, course.course_id);
                if (unitIndex === -1) return;
                
                const hasSubUnit = unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0;
                if (hasSubUnit) {
                  unit.subUnit.forEach((sub: any) => {
                    const subUnitIndex = findSubUnitIndex(unitIndex, sub.id);
                    if (subUnitIndex === -1) return;
                    
                    combinedSubUnits.push({
                      id: sub.id,
                      title: sub.title,
                      unitId: unit.id,
                      courseId: course.course_id,
                      unitIndex,
                      subUnitIndex,
                    });
                  });
                } else {
                  // If unit doesn't have subUnit, add the unit itself
                  combinedSubUnits.push({
                    id: unit.id,
                    title: unit.title,
                    unitId: unit.id,
                    courseId: course.course_id,
                    unitIndex,
                  });
                }
              });

              if (combinedSubUnits.length === 0) return null;

              return (
                <StandardCourseMinimal
                  key={unitType}
                  title={unitType}
                  rows={combinedSubUnits}
                  control={control}
                  courseId={course.course_id}
                  findUnitIndex={findUnitIndex}
                  findSubUnitIndex={findSubUnitIndex}
                  canEditLearnerFields={canEditLearnerFields}
                  canEditTrainerFields={canEditTrainerFields}
                  getEvidenceCount={getEvidenceCount}
                  setValue={setValue}
                  trigger={trigger}
                  unitsWatch={unitsWatch}
                  learnerMapHandler={standardLearnerMapHandler}
                  trainerMapHandler={standardTrainerMapHandler}
                  signedOffHandler={standardSignedOffHandler}
                  commentHandler={standardCommentHandler}
                  selectAllSignedOffForCombinedHandler={selectAllSignedOffForCombinedHandler}
                  combinedSubUnits={combinedSubUnits}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

