import type { CourseUnit } from "@/store/api/skills-scan/types";

/**
 * Whether a unit is rated as a single row instead of through its sub-units.
 *
 * Standard courses keep their Knowledge/Skills/Behaviour criteria as sub-units of
 * each duty, so those are rated individually. Only a Standard unit with no
 * criteria is rated directly. Qualification units are always rated by sub-unit.
 */
export const ratesUnitDirectly = (
  unit: Pick<CourseUnit, "subUnit">,
  isStandardType: boolean
): boolean => isStandardType && !(unit.subUnit && unit.subUnit.length > 0);
