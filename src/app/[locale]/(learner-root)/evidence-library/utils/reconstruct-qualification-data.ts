/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EvidenceMapping } from "@/store/api/evidence/types";
import type { Module, Unit as QualificationUnit, Task } from "../components/create-view/evidence-form-types";
import type { LearnerCourse } from "@/store/api/learner/types";
import { COURSE_TYPES } from "../components/constants";

/**
 * Reconstructs the form state from API mappings for Qualification courses
 * For Qualification courses: unit_code contains task ID
 * Structure: Course → Module → Unit → Task
 */
export function reconstructQualificationData(
  mappings: EvidenceMapping[],
  courses: LearnerCourse[]
): {
  selectedCourses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    modules?: Module[];
  }>;
  qualificationStructures: Array<{
    course_id: number;
    modules: Module[];
  }>;
} {
  if (!mappings || mappings.length === 0 || !courses || courses.length === 0) {
    return { selectedCourses: [], qualificationStructures: [] };
  }

  // Group mappings by course_id
  const mappingsByCourse = new Map<number, EvidenceMapping[]>();
  mappings.forEach((mapping) => {
    const courseId = mapping?.course_id || mapping.course?.course_id;
    if (!courseId) return;

    if (!mappingsByCourse.has(courseId)) {
      mappingsByCourse.set(courseId, []);
    }
    mappingsByCourse.get(courseId)!.push(mapping);
  });

  const selectedCourses: Array<{
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    modules?: Module[];
  }> = [];
  const qualificationStructures: Array<{
    course_id: number;
    modules: Module[];
  }> = [];

  mappingsByCourse.forEach((courseMappings, courseId) => {
    // Find the course from learner courses
    const learnerCourse = courses.find(
      (lc) => lc.course?.course_id === courseId || (lc as any).course_id === courseId
    );
    const course = learnerCourse?.course || (learnerCourse as any);
    
    if (!course || course.course_core_type !== COURSE_TYPES.QUALIFICATION) {
      return;
    }

    // Add course to selected courses
    selectedCourses.push({
      course_id: course.course_id,
      course_name: course.course_name,
      course_code: course.course_code,
      course_core_type: course.course_core_type,
      modules: course.modules || [],
    });

    // Get course modules structure
    const courseModules = course.modules || [];
    if (!courseModules || courseModules.length === 0) {
      return;
    }

    // Reconstruct modules structure with mappings
    const modulesMap = new Map<string | number, Module>();

    // Initialize all modules from course structure
    courseModules.forEach((module:any) => {
      const moduleKey = module.id;
      if (!modulesMap.has(moduleKey)) {
        modulesMap.set(moduleKey, {
          ...module,
          learnerMap: undefined, // Not mappable
          trainerMap: undefined,
          signedOff: undefined,
          units: (module.units || []).map((unit:any) => ({
            ...unit,
            learnerMap: undefined, // Not mappable
            trainerMap: undefined,
            signedOff: undefined,
            tasks: (unit.tasks || []).map((task:any) => ({
              ...task,
              learnerMap: false, // Mappable, starts unchecked
              trainerMap: false,
              signedOff: false,
              comment: "",
            })),
          })),
        });
      }
    });

    // Apply mappings to tasks
    courseMappings.forEach((mapping) => {
      const taskId = mapping.unit_code; // For Qualification, unit_code = task ID
      if (!taskId) return;

      // Find the task in the course structure (Module → Unit → Task)
      let foundTask: Task | null = null;
      let foundUnit: QualificationUnit | null = null;
      let foundModule: Module | null = null;

      for (const courseModule of courseModules) {
        if (courseModule.units && Array.isArray(courseModule.units)) {
          for (const unit of courseModule.units) {
            if (unit.tasks && Array.isArray(unit.tasks)) {
              const task = unit.tasks.find(
                (t: any) => String(t.id) === String(taskId) || t.code === taskId
              );
              if (task) {
                foundTask = task;
                foundUnit = unit;
                foundModule = courseModule;
                break;
              }
            }
          }
          if (foundTask) break;
        }
      }

      if (foundTask && foundUnit && foundModule) {
        const moduleKey = foundModule.id;
        const moduleData = modulesMap.get(moduleKey);
        if (!moduleData) return;

        // Find or create the unit in moduleData
        let unitData = moduleData.units?.find(
          (u) => String(u.id) === String(foundUnit!.id)
        );
        if (!unitData) {
          if (!moduleData.units) moduleData.units = [];
          moduleData.units.push({
            ...foundUnit,
            learnerMap: undefined,
            trainerMap: undefined,
            signedOff: undefined,
            tasks: [],
          });
          unitData = moduleData.units[moduleData.units.length - 1];
        }

        // Find or create the task in unitData
        if (!unitData.tasks) unitData.tasks = [];
        let taskData = unitData.tasks.find(
          (t) => String(t.id) === String(taskId)
        );

        if (!taskData) {
          // Support both camelCase and snake_case from API
          const learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? false;
          const trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? false;
          const signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? false;
          const comment = mapping.comment ?? "";

          taskData = {
            ...foundTask,
            learnerMap,
            trainerMap,
            signedOff,
            comment,
            mapping_id: mapping.mapping_id,
          };
          unitData.tasks.push(taskData);
        } else {
          // Update existing task with mapping data
          taskData.learnerMap = mapping.learnerMap ?? (mapping as any).learner_map ?? taskData.learnerMap;
          taskData.trainerMap = mapping.trainerMap ?? (mapping as any).trainer_map ?? taskData.trainerMap;
          taskData.signedOff = mapping.signedOff ?? (mapping as any).signed_off ?? taskData.signedOff;
          taskData.comment = mapping.comment ?? taskData.comment;
          taskData.mapping_id = mapping.mapping_id;
        }
      }
    });

    // Convert modules map to array
    const reconstructedModules = Array.from(modulesMap.values());

    qualificationStructures.push({
      course_id: courseId,
      modules: reconstructedModules,
    });
  });

  return { selectedCourses, qualificationStructures };
}

