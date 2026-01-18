import type { SamplePlanLearner } from "@/store/api/qa-sample-plan/types";
import { assessmentMethodCodesForPayload } from "../../constants";

export interface ApplySamplesPayload {
  plan_id: string | number;
  sample_type: string;
  created_by: string | number;
  assessment_methods: Record<string, boolean>;
  learners: Array<{
    learner_id: string | number;
    plannedDate: string | null;
    units: Array<{ id: string | number; unit_ref: string }>;
  }>;
}

export interface BuildPayloadParams {
  selectedPlan: string;
  sampleType: string;
  iqaId: string | number;
  learnersData: SamplePlanLearner[];
  selectedUnitsMap: Record<string, Set<string>>;
  dateFrom: string;
  selectedMethods: string[];
}

/**
 * Build the payload for applying samples
 */
export function buildApplySamplesPayload({
  selectedPlan,
  sampleType,
  iqaId,
  learnersData,
  selectedUnitsMap,
  dateFrom,
  selectedMethods,
}: BuildPayloadParams): ApplySamplesPayload | null {
  const learnersPayload = learnersData
    .map((row, rowIndex) => {
      const learnerId = row?.learner_id ?? row?.learnerId ?? row?.id ?? null;
      const units = Array.isArray(row.units) ? row.units : [];
      const learnerKey = `${row.learner_name ?? ""}-${rowIndex}`;
      const selectedUnitsSet = selectedUnitsMap[learnerKey] || new Set<string>();

      const selectedUnits = units
        .filter((unit: any) => {
          if (!unit) return false;
          // Match old implementation: use unit_code if truthy, else unit_name, else empty string
          // Convert to string to match the Set values (which are stored as strings)
          const unitKey = String(unit.unit_code || unit.unit_name || "");
          return unitKey && unitKey.trim() && selectedUnitsSet.has(unitKey);
        })
        .map((unit) => {
          const unitIdRaw = unit?.unit_code ?? Date.now();
          const unitRefRaw = unit?.unit_name ?? unitIdRaw;
          const unitRef = String(unitRefRaw).trim();
          return {
            id: Number(unitIdRaw),
            unit_ref: unitRef,
          };
        })
        .filter((unit) => unit.unit_ref);

      if (!learnerId || !selectedUnits.length) return null;

      const numericLearnerId = Number(learnerId);
      const learnerIdForRequest = Number.isFinite(numericLearnerId)
        ? numericLearnerId
        : learnerId;

      return {
        learner_id: learnerIdForRequest,
        plannedDate: dateFrom ?? null,
        units: selectedUnits,
      };
    })
    .filter(Boolean) as Array<{
    learner_id: string | number;
    plannedDate: string | null;
    units: Array<{ id: string | number; unit_ref: string }>;
  }>;

  if (!learnersPayload.length) {
    return null;
  }

  const assessmentMethodsPayload = assessmentMethodCodesForPayload.reduce(
    (accumulator, code) => {
      accumulator[code] = selectedMethods.includes(code);
      return accumulator;
    },
    {} as Record<string, boolean>
  );

  const numericPlanId = Number(selectedPlan);
  const planIdForRequest = Number.isFinite(numericPlanId)
    ? numericPlanId
    : selectedPlan;

  return {
    plan_id: planIdForRequest,
    sample_type: sampleType,
    created_by: Number.isFinite(Number(iqaId)) ? Number(iqaId) : iqaId,
    assessment_methods: assessmentMethodsPayload,
    learners: learnersPayload,
  };
}
