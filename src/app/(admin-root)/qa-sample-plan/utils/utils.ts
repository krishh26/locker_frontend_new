import type { SamplePlanLearnerUnit } from "@/store/api/qa-sample-plan/types";

export const sanitizeText = (value?: string | null): string => {
  if (value === null || value === undefined) {
    return "-";
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : "-";
};

export const formatDisplayDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getRiskBadgeVariant = (riskLevel?: string): "default" | "destructive" | "secondary" | "outline" => {
  if (!riskLevel) {
    return "default";
  }
  const normalized = riskLevel.toLowerCase();
  if (normalized.includes("high")) {
    return "destructive";
  }
  if (normalized.includes("medium")) {
    return "secondary";
  }
  if (normalized.includes("low")) {
    return "default";
  }
  return "outline";
};

export const countSelectedUnits = (units?: SamplePlanLearnerUnit[]): number => {
  if (!Array.isArray(units)) {
    return 0;
  }
  // Count units that have sample_history (already sampled)
  return units.filter((unit: any) => {
    return Array.isArray(unit?.sample_history) && unit.sample_history.length > 0;
  }).length;
};

/**
 * Get the most recent planned_date from a learner's units' sample_history
 * Falls back to learner.planned_date if no sample_history exists
 */
export const getLearnerPlannedDate = (learner: any): string | null => {
  // First check if learner has a direct planned_date
  if (learner?.planned_date) {
    return learner.planned_date;
  }

  // Extract all planned dates from sample_history across all units
  const plannedDates: string[] = [];
  if (Array.isArray(learner?.units)) {
    learner.units.forEach((unit: any) => {
      if (Array.isArray(unit?.sample_history)) {
        unit.sample_history.forEach((history: any) => {
          if (history?.planned_date) {
            plannedDates.push(history.planned_date);
          }
        });
      }
    });
  }

  if (plannedDates.length === 0) {
    return null;
  }

  // Return the most recent date (latest)
  return plannedDates[0];
};

