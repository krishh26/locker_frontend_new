/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EvidenceMapping } from "@/store/api/evidence/types";
import type { StandardUnit } from "../components/create-view/evidence-form-types";
import type { LearnerCourse } from "@/store/api/learner/types";
import { COURSE_TYPES } from "../components/constants";

/**
 * Reconstructs the complete form state from API mappings for both Standard and Qualification courses
 * This function handles:
 * - Standard courses: Reconstructs selected courses, types, and units with mappings
 * - Qualification courses: Reconstructs selected courses and units structure (units => subUnit => topics)
 */
export function reconstructFormStateFromMappings(
  mappings: EvidenceMapping[],
  courses: LearnerCourse[]
): {
  selectedCourses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: StandardUnit[];
  }>;
  courseSelectedTypes: Record<string | number, string[]>;
  units: (StandardUnit | { id: string | number; course_id?: string | number })[];
} {
  if (!mappings || mappings.length === 0 || !courses || courses.length === 0) {
    return { selectedCourses: [], courseSelectedTypes: {}, units: [] };
  }

  // Group mappings by course_id
  const mappingsByCourse = new Map<number, EvidenceMapping[]>();
  mappings.forEach((mapping) => {
    // Support both direct course_id and nested course.course_id
    const courseId = (mapping as any).course_id || mapping.course?.course_id;
    if (!courseId) return;

    if (!mappingsByCourse.has(courseId)) {
      mappingsByCourse.set(courseId, []);
    }
    mappingsByCourse.get(courseId)!.push(mapping);
  });

  const selectedCoursesArray: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: StandardUnit[];
  }> = [];
  const courseSelectedTypesObj: Record<string | number, string[]> = {};
  const unitsArray: (StandardUnit | { id: string | number; course_id?: string | number })[] = [];

  mappingsByCourse.forEach((courseMappings, courseId) => {
    // Find the course from learner courses
    const learnerCourse = courses.find(
      (lc) => lc.course?.course_id === courseId || (lc as any).course_id === courseId
    );
    const course = learnerCourse?.course || (learnerCourse as any);
    
    if (!course) return;

    // Add course to selected courses
    selectedCoursesArray.push({
      course_id: course.course_id,
      course_name: course.course_name,
      course_code: course.course_code,
      course_core_type: course.course_core_type,
      units: course.units || [],
    });

    // Handle Qualification courses
    if (course.course_core_type === COURSE_TYPES.QUALIFICATION) {
      // Course structure: units => subUnit => topics
      const courseUnits = course.units || [];
      
      if (courseUnits.length === 0) {
        return;
      }
      
      // Track which units have mappings (to determine which units to select)
      const unitsWithMappings = new Set<string | number>();
      
      // First, find all units that have mappings by checking topic IDs in mappings
      courseMappings.forEach((mapping) => {
        const topicId = mapping.unit_code; // For Qualification, unit_code = topic ID
        
        // Check all units to find which unit contains this topic
        for (const unit of courseUnits) {
          let foundInUnit = false;
          if (unit.subUnit && Array.isArray(unit.subUnit)) {
            for (const subUnit of unit.subUnit) {
              if (subUnit.topics && Array.isArray(subUnit.topics)) {
                const topic = subUnit.topics.find(
                  (t: any) => String(t.id) === String(topicId) || t.code === topicId
                );
                if (topic) {
                  unitsWithMappings.add(unit.id);
                  foundInUnit = true;
                  break; // Break out of subUnit loop
                }
              }
            }
          }
          if (foundInUnit) {
            break; // Break out of unit loop once we found the mapping's unit
          }
        }
      });

      // Reconstruct units with mappings
      const unitsMap = new Map<string | number, any>();

      // Initialize all units that have mappings
      courseUnits.forEach((unit: any) => {
        if (unitsWithMappings.has(unit.id)) {
          const unitKey = unit.id;
          if (!unitsMap.has(unitKey)) {
            // Initialize unit with all subUnits and topics
            const unitData: any = {
              ...unit,
              course_id: courseId,
              subUnit: [],
            };

            // Add all subUnits with all topics
            if (unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0) {
              unitData.subUnit = unit.subUnit.map((subUnit: any) => {
                const subUnitData: any = {
                  ...subUnit,
                  topics: [],
                };

                // Add all topics from the course structure
                if (subUnit.topics && Array.isArray(subUnit.topics) && subUnit.topics.length > 0) {
                  subUnitData.topics = subUnit.topics.map((topic: any) => {
                    // Check if this topic has a mapping
                    const mapping = courseMappings.find(
                      (m) => String(m.unit_code) === String(topic.id)
                    );

                    if (mapping) {
                      // Apply mapping values
                      const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
                      const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
                      const signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? false;
                      const comment = mapping.comment ?? "";

                      return {
                        ...topic,
                        learnerMap,
                        trainerMap,
                        signedOff,
                        comment,
                        mapping_id: mapping.mapping_id,
                      };
                    } else {
                      // No mapping, use default values
                      return {
                        ...topic,
                        learnerMap: false,
                        trainerMap: false,
                        signedOff: false,
                        comment: "",
                      };
                    }
                  });
                }

                return subUnitData;
              });
            }

            unitsMap.set(unitKey, unitData);
          }
        }
      });

      // Store individual units for checkbox selection and hierarchy display
      unitsArray.push(...Array.from(unitsMap.values()));

      return; // Skip Standard course handling
    }

    // Handle Standard courses
    if (course.course_core_type === COURSE_TYPES.STANDARD) {
      const courseUnits = course.units || [];
      const unitsMap = new Map<string, StandardUnit>();

      // Collect all types that have mappings (not just the first one)
      const selectedTypesSet = new Set<string>();
      if (courseMappings.length > 0 && courseUnits.length > 0) {
        courseMappings.forEach((mapping) => {
          const unitIdOrRef = mapping.unit_code;
          if (unitIdOrRef) {
            // Find the unit to determine its type
            const matchedUnit = courseUnits.find(
              (u: any) => String(u.id) === String(unitIdOrRef) || u.code === unitIdOrRef || u.unit_ref === unitIdOrRef
            );
            if (matchedUnit?.type) {
              selectedTypesSet.add(matchedUnit.type);
            }
          }
        });
      }

      // Set selected types as array
      if (selectedTypesSet.size > 0) {
        courseSelectedTypesObj[courseId] = Array.from(selectedTypesSet);
      }

      // Initialize ALL units from all selected types
      if (selectedTypesSet.size > 0) {
        const filteredUnits = courseUnits.filter((u: any) => selectedTypesSet.has(u.type));
        filteredUnits.forEach((unit: any) => {
          const unitKey = `${courseId}-${unit.id || unit.code}`;
          if (!unitsMap.has(unitKey)) {
            const hasSubUnit = unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0;
            unitsMap.set(unitKey, {
              ...unit,
              course_id: courseId,
              type: unit.type,
              code: unit.code || unit.unit_ref,
              subUnit: hasSubUnit
                ? unit.subUnit.map((sub: any) => ({
                    ...sub,
                    learnerMap: false,
                    trainerMap: false,
                    signedOff: false,
                    comment: "",
                  }))
                : [],
              learnerMap: hasSubUnit ? undefined : false,
              trainerMap: hasSubUnit ? undefined : false,
              signedOff: hasSubUnit ? undefined : false,
              comment: hasSubUnit ? undefined : "",
            });
          }
        });
      }

      // Apply mappings to units (overwrite default values)
      courseMappings.forEach((mapping) => {
        const unitIdOrRef = mapping.unit_code;
        const subUnitRef = mapping.sub_unit_id;

        // Find the unit in course structure
        const unit = courseUnits.find(
          (u: any) => String(u.id) === String(unitIdOrRef) || u.code === unitIdOrRef || u.unit_ref === unitIdOrRef
        );
        if (!unit) return;

        const unitKey = `${courseId}-${unit.id || unit.code}`;
        let unitData = unitsMap.get(unitKey);

        // If unit not in map yet (shouldn't happen if type is selected, but handle it)
        if (!unitData) {
          const hasSubUnit = unit.subUnit && Array.isArray(unit.subUnit) && unit.subUnit.length > 0;
          const newUnitData: StandardUnit = {
            ...unit,
            course_id: courseId,
            type: unit.type,
            code: unit.code || unit.unit_ref,
            subUnit: hasSubUnit
              ? unit.subUnit.map((sub: any) => ({
                  ...sub,
                  learnerMap: false,
                  trainerMap: false,
                  signedOff: false,
                  comment: "",
                }))
              : [],
            learnerMap: hasSubUnit ? undefined : false,
            trainerMap: hasSubUnit ? undefined : false,
            signedOff: hasSubUnit ? undefined : false,
            comment: hasSubUnit ? undefined : "",
          };
          unitsMap.set(unitKey, newUnitData);
          unitData = newUnitData;
        }

        // Ensure unitData is defined before using it
        if (!unitData) return;

        // If mapping has sub_unit_id, it's a sub unit mapping
        if (subUnitRef !== null && subUnitRef !== undefined) {
          // Find the subunit in the unit's subUnit array
          const subunit = unit.subUnit?.find(
            (s: any) => String(s.id) === String(subUnitRef) || s.code === subUnitRef
          );
          if (subunit) {
            const existingSubUnit = unitData.subUnit.find(
              (s: any) => String(s.id) === String(subUnitRef) || s.code === subUnitRef
            );
            if (existingSubUnit) {
              // Update existing subunit with mapping values
              const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
              const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
              const signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? false;
              const comment = mapping.comment ?? "";
              
              existingSubUnit.learnerMap = learnerMap;
              existingSubUnit.trainerMap = trainerMap;
              existingSubUnit.signedOff = signedOff;
              existingSubUnit.comment = comment;
              existingSubUnit.mapping_id = mapping.mapping_id;
            } else {
              // Add new subunit with mapping values
              const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
              const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
              const signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? false;
              const comment = mapping.comment ?? "";
              
              unitData.subUnit.push({
                ...subunit,
                learnerMap,
                trainerMap,
                signedOff,
                comment,
                mapping_id: mapping.mapping_id,
              });
            }
          }
        } else {
          // Unit-only mapping (no subunits)
          // Support both camelCase and snake_case from API
          const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
          const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
          const signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? false;
          const comment = mapping.comment ?? "";
          
          unitData.learnerMap = learnerMap;
          unitData.trainerMap = trainerMap;
          unitData.signedOff = signedOff;
          unitData.comment = comment;
          unitData.mapping_id = mapping.mapping_id;
        }
      });

      unitsArray.push(...Array.from(unitsMap.values()));
    }
  });

  return {
    selectedCourses: selectedCoursesArray,
    courseSelectedTypes: courseSelectedTypesObj,
    units: unitsArray,
  };
}

