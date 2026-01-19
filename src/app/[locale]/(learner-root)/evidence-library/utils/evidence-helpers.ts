// Helper functions for Evidence Library

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getStatusColor = (
  status: string
): "default" | "warning" | "success" | "info" => {
  switch (status.toLowerCase()) {
    case "not started":
      return "default";
    case "in progress":
      return "warning";
    case "completed":
      return "success";
    case "submitted":
      return "info";
    default:
      return "default";
  };
};

export const displayValue = (value: string | null | undefined): string => {
  if (
    value === null ||
    value === undefined ||
    value === "null" ||
    value === "" ||
    value.trim() === ""
  ) {
    return "-";
  }
  return value;
};

export const truncateText = (
  text: string | null,
  maxLength: number = 50
): string => {
  if (!text || text === "null" || text.trim() === "") return "-";
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

export const getUnitMappingStatus = (
  evidence: {
    mappings?: Array<{
      unit_code: string;
      sub_unit_id: number | null;
      learnerMap: boolean;
      trainerMap: boolean;
      signedOff?: boolean;
      course?: { course_core_type?: string };
    }>;
  },
  unitId: string | number,
  unitCode?: string,
  isSubUnit: boolean = false
): { learnerMap: boolean; trainerMap: boolean; signedOff: boolean } => {
  const defaultStatus = {
    learnerMap: false,
    trainerMap: false,
    signedOff: false,
  };

  // Check mappings array from API response
  if (evidence.mappings && Array.isArray(evidence.mappings)) {
    for (const mapping of evidence.mappings) {
      const isQualificationCourse =
        mapping.course?.course_core_type === "Qualification";

      if (isSubUnit) {
        // For subunits: match by sub_unit_id (must be a number and match)
        if (
          mapping.sub_unit_id !== null &&
          Number(mapping.sub_unit_id) === Number(unitId)
        ) {
          return {
            learnerMap: mapping.learnerMap === true,
            trainerMap: mapping.trainerMap === true,
            signedOff: mapping.signedOff === true,
          };
        }
        // For Qualification courses: when sub_unit_id is null, unit_code might be a sub-unit ID
        if (
          isQualificationCourse &&
          mapping.sub_unit_id === null &&
          String(mapping.unit_code) === String(unitId)
        ) {
          return {
            learnerMap: mapping.learnerMap === true,
            trainerMap: mapping.trainerMap === true,
            signedOff: mapping.signedOff === true,
          };
        }
      } else {
        // For units: match by unit_code (which is actually the unit ID, not the code)
        // For Qualification courses: when sub_unit_id is null, unit_code is a sub-unit ID, not a unit ID
        // So we should NOT match it as a unit for Qualification courses
        if (
          mapping.sub_unit_id === null &&
          String(mapping.unit_code) === String(unitId)
        ) {
          // Only match as a unit if it's NOT a Qualification course
          // (For Qualification courses, unit_code with null sub_unit_id is a sub-unit ID)
          if (!isQualificationCourse) {
            return {
              learnerMap: mapping.learnerMap === true,
              trainerMap: mapping.trainerMap === true,
              signedOff: mapping.signedOff === true,
            };
          }
        }
      }
    }
  }

  return defaultStatus;
};

