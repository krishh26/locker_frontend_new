import type { SamplePlanLearner, SamplePlanLearnerUnit } from "@/store/api/qa-sample-plan/types";

export interface Course {
  id: string;
  name: string;
}

export interface Plan {
  id: string;
  label: string;
}

export interface PlanSummary {
  planId?: string;
  courseName?: string;
}

// Context types removed - now using Redux
// Keeping only component prop types if needed
