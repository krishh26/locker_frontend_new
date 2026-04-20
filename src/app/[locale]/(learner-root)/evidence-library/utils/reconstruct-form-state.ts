/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EvidenceMapping } from "@/store/api/evidence/types";
import type { StandardUnit } from "../components/create-view/evidence-form-types";
import type { LearnerCourse } from "@/store/api/learner/types";
import { COURSE_TYPES } from "../components/constants";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/** Qualification: match API row to a topic — new shape (`unit_code` + `topic_id` + `sub_unit_id`) or legacy (`unit_code` = topic id). */
function findQualMappingForTopic(
  courseMappings: EvidenceMapping[],
  unit: any,
  subUnit: any,
  topic: any,
): EvidenceMapping | undefined {
  const tid = str(topic.id);
  const tcode =
    topic.code != null && topic.code !== "" ? str(topic.code) : "";

  return courseMappings.find((m) => {
    const rawTopicId = (m as { topic_id?: unknown }).topic_id;
    const hasTopicIdCol =
      rawTopicId !== undefined &&
      rawTopicId !== null &&
      str(rawTopicId).trim() !== "";

    if (hasTopicIdCol) {
      const mtid = str(rawTopicId);
      if (str(m.unit_code) !== str(unit.id)) return false;
      if (m.sub_unit_id != null && str(m.sub_unit_id) !== "") {
        if (str(m.sub_unit_id) !== str(subUnit.id)) return false;
      }
      return mtid === tid || (tcode !== "" && mtid === tcode);
    }

    return str(m.unit_code) === tid || (tcode !== "" && str(m.unit_code) === tcode);
  });
}

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
      const unitsWithMappings = new Set<string>();

      const addUnitKey = (unitId: string | number | undefined) => {
        if (unitId === undefined || unitId === null) return;
        unitsWithMappings.add(str(unitId));
      };

      // New API: unit_code = parent unit, topic_id + sub_unit_id identify the row.
      // Legacy: unit_code = topic id only.
      courseMappings.forEach((mapping) => {
        const rawTopicId = (mapping as { topic_id?: unknown }).topic_id;
        const hasTopicIdCol =
          rawTopicId !== undefined &&
          rawTopicId !== null &&
          str(rawTopicId).trim() !== "";

        if (hasTopicIdCol) {
          const parentRef = str(mapping.unit_code);
          const directUnit = courseUnits.find((u: any) => str(u.id) === parentRef);
          if (directUnit) {
            addUnitKey(directUnit.id);
            return;
          }
        }

        const topicRef = hasTopicIdCol ? str(rawTopicId) : str(mapping.unit_code);

        for (const unit of courseUnits) {
          let foundInUnit = false;
          if (unit.subUnit && Array.isArray(unit.subUnit)) {
            for (const subUnit of unit.subUnit) {
              if (subUnit.topics && Array.isArray(subUnit.topics)) {
                const topic = subUnit.topics.find(
                  (t: any) => str(t.id) === topicRef || str(t.code) === topicRef
                );
                if (topic) {
                  addUnitKey(unit.id);
                  foundInUnit = true;
                  break;
                }
              }
            }
          }
          if (foundInUnit) break;
        }
      });

      // Reconstruct units with mappings
      const unitsMap = new Map<string | number, any>();

      // Initialize all units that have mappings
      courseUnits.forEach((unit: any) => {
        if (unitsWithMappings.has(str(unit.id))) {
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
                    const mapping = findQualMappingForTopic(
                      courseMappings,
                      unit,
                      subUnit,
                      topic,
                    );

                    if (mapping) {
                      // Apply mapping values
                      const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
                      const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
                      const signed_off =
                        mapping.signed_off ??
                        (mapping as { signedOff?: boolean }).signedOff ??
                        false;
                      const comment = mapping.comment ?? "";

                      return {
                        ...topic,
                        learnerMap,
                        trainerMap,
                        signed_off,
                        comment,
                        mapping_id: mapping.mapping_id,
                      };
                    } else {
                      // No mapping, use default values
                      return {
                        ...topic,
                        learnerMap: false,
                        trainerMap: false,
                        signed_off: false,
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
      const getMappingValues = (mapping: EvidenceMapping) => {
        const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
        const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
        const signed_off =
          mapping.signed_off ??
          (mapping as { signedOff?: boolean }).signedOff ??
          false;
        const comment = mapping.comment ?? "";
        return { learnerMap, trainerMap, signed_off, comment };
      };

      // Collect all types that have mappings (not just the first one)
      const selectedTypesSet = new Set<string>();
      if (courseMappings.length > 0 && courseUnits.length > 0) {
        courseMappings.forEach((mapping) => {
          const unitIdOrRef = mapping.unit_code;
          const subUnitRef = mapping.sub_unit_id;
          if (unitIdOrRef) {
            // Find unit-level type first (legacy shape)
            const matchedUnit = courseUnits.find(
              (u: any) => String(u.id) === String(unitIdOrRef) || u.code === unitIdOrRef || u.unit_ref === unitIdOrRef
            );
            const matchedSubUnitInUnit = subUnitRef
              ? matchedUnit?.subUnit?.find(
                  (sub: any) => String(sub.id) === String(subUnitRef) || sub.code === subUnitRef
                )
              : undefined;
            if (matchedSubUnitInUnit?.type) {
              selectedTypesSet.add(matchedSubUnitInUnit.type);
              return;
            }
            if (matchedUnit?.type) {
              selectedTypesSet.add(matchedUnit.type);
              return;
            }

            // Fallback: type may be on subUnit (current payload shape)
            for (const unit of courseUnits) {
              const lookupRef =
                subUnitRef !== null && subUnitRef !== undefined ? subUnitRef : unitIdOrRef;
              const matchedSubUnit = unit.subUnit?.find(
                (sub: any) => String(sub.id) === String(lookupRef) || sub.code === lookupRef
              );
              if (matchedSubUnit?.type) {
                selectedTypesSet.add(matchedSubUnit.type);
                break;
              }
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
        selectedTypesSet.forEach((selectedType) => {
          courseUnits.forEach((unit: any) => {
            const unitSubUnits = Array.isArray(unit.subUnit) ? unit.subUnit : [];
            const matchingSubUnits = unitSubUnits.filter(
              (sub: any) => String(sub.type) === String(selectedType)
            );
            const matchesByUnitType = String(unit.type) === String(selectedType);
            const matchesBySubUnitType = matchingSubUnits.length > 0;

            if (!matchesByUnitType && !matchesBySubUnitType) {
              return;
            }

            const normalizedSubUnits = (matchesByUnitType ? unitSubUnits : matchingSubUnits).map(
              (sub: any) => ({
                ...sub,
                learnerMap: false,
                trainerMap: false,
                signed_off: false,
                comment: "",
              })
            );

            const hasSubUnit = normalizedSubUnits.length > 0;
            const unitKey = `${courseId}-${unit.id || unit.code}-${selectedType}`;
            if (!unitsMap.has(unitKey)) {
              unitsMap.set(unitKey, {
                ...unit,
                course_id: courseId,
                type: selectedType,
                code: unit.code || unit.unit_ref,
                subUnit: normalizedSubUnits,
                learnerMap: hasSubUnit ? undefined : false,
                trainerMap: hasSubUnit ? undefined : false,
                signed_off: hasSubUnit ? undefined : false,
                comment: hasSubUnit ? undefined : "",
              });
            }
          });
        });
      }

      // Apply mappings to units (overwrite default values)
      courseMappings.forEach((mapping) => {
        const unitIdOrRef = mapping.unit_code;
        const subUnitRef = mapping.sub_unit_id;
        const targetSubUnitRef =
          subUnitRef !== null && subUnitRef !== undefined ? subUnitRef : unitIdOrRef;

        const unit = courseUnits.find(
          (u: any) => String(u.id) === String(unitIdOrRef) || u.code === unitIdOrRef || u.unit_ref === unitIdOrRef
        );
        const unitBySubUnit = courseUnits.find((u: any) =>
          u.subUnit?.some(
            (sub: any) => String(sub.id) === String(targetSubUnitRef) || sub.code === targetSubUnitRef
          )
        );
        const resolvedUnit = unit || unitBySubUnit;
        if (!resolvedUnit) return;

        const resolvedType =
          resolvedUnit.type ||
          resolvedUnit.subUnit?.find(
            (sub: any) => String(sub.id) === String(targetSubUnitRef) || sub.code === targetSubUnitRef
          )?.type;
        if (!resolvedType) return;

        const unitKey = `${courseId}-${resolvedUnit.id || resolvedUnit.code}-${resolvedType}`;
        let unitData = unitsMap.get(unitKey);

        // If unit not in map yet, initialize compatible shape
        if (!unitData) {
          const unitSubUnits = Array.isArray(resolvedUnit.subUnit) ? resolvedUnit.subUnit : [];
          const matchingSubUnits = unitSubUnits.filter(
            (sub: any) => String(sub.type) === String(resolvedType)
          );
          const matchesByUnitType = String(resolvedUnit.type) === String(resolvedType);
          const normalizedSubUnits = (matchesByUnitType ? unitSubUnits : matchingSubUnits).map(
            (sub: any) => ({
              ...sub,
              learnerMap: false,
              trainerMap: false,
              signed_off: false,
              comment: "",
            })
          );
          const hasSubUnit = normalizedSubUnits.length > 0;
          const newUnitData: StandardUnit = {
            ...resolvedUnit,
            course_id: courseId,
            type: resolvedType,
            code: resolvedUnit.code || resolvedUnit.unit_ref,
            subUnit: normalizedSubUnits,
            learnerMap: hasSubUnit ? undefined : false,
            trainerMap: hasSubUnit ? undefined : false,
            signed_off: hasSubUnit ? undefined : false,
            comment: hasSubUnit ? undefined : "",
          };
          unitsMap.set(unitKey, newUnitData);
          unitData = newUnitData;
        }

        // Ensure unitData is defined before using it
        if (!unitData) return;

        // For standard mappings, support both:
        // - sub_unit_id provided (new payload shape)
        // - unit_code carrying subUnit id when sub_unit_id is null
        const sourceSubUnit = resolvedUnit.subUnit?.find(
          (s: any) => String(s.id) === String(targetSubUnitRef) || s.code === targetSubUnitRef
        );
        const existingSubUnit = unitData.subUnit.find(
          (s: any) => String(s.id) === String(targetSubUnitRef) || s.code === targetSubUnitRef
        );

        if (sourceSubUnit) {
          const { learnerMap, trainerMap, signed_off, comment } = getMappingValues(mapping);
          if (existingSubUnit) {
            existingSubUnit.learnerMap = learnerMap;
            existingSubUnit.trainerMap = trainerMap;
            existingSubUnit.signed_off = signed_off;
            existingSubUnit.comment = comment;
            existingSubUnit.mapping_id = mapping.mapping_id;
          } else {
            unitData.subUnit.push({
              ...sourceSubUnit,
              learnerMap,
              trainerMap,
              signed_off,
              comment,
              mapping_id: mapping.mapping_id,
            });
          }
        } else {
          // Unit-only mapping (no subunits)
          const { learnerMap, trainerMap, signed_off, comment } = getMappingValues(mapping);
          
          unitData.learnerMap = learnerMap;
          unitData.trainerMap = trainerMap;
          unitData.signed_off = signed_off;
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

