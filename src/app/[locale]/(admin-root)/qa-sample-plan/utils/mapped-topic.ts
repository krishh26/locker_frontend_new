import type { EvidenceItem } from "@/store/api/qa-sample-plan/types";

export type MappedSubUnitEntry = EvidenceItem["mappedSubUnits"][number];

/** Column/match id: topic_id for qualification; subUnit `id` when topic_id is null (standard). */
export function getMappedCriteriaId(entry: MappedSubUnitEntry): string {
  const topicId = (entry as { topic_id?: string | number | null }).topic_id;
  if (
    topicId !== undefined &&
    topicId !== null &&
    String(topicId).trim() !== "" &&
    String(topicId).toLowerCase() !== "null"
  ) {
    return String(topicId);
  }
  return String(entry.id);
}

/** @deprecated Use getMappedCriteriaId */
export function getMappedTopicId(entry: MappedSubUnitEntry): string {
  return getMappedCriteriaId(entry);
}

export function findMappedEntryByCriteriaId(
  mappedSubUnits: MappedSubUnitEntry[] | undefined,
  criteriaId: string | number,
): MappedSubUnitEntry | undefined {
  return mappedSubUnits?.find(
    (entry) => getMappedCriteriaId(entry) === String(criteriaId),
  );
}

/** @deprecated Use findMappedEntryByCriteriaId */
export function findMappedEntryByTopicId(
  mappedSubUnits: MappedSubUnitEntry[] | undefined,
  topicId: string | number,
): MappedSubUnitEntry | undefined {
  return findMappedEntryByCriteriaId(mappedSubUnits, topicId);
}

/** Qualification: "1.1 ..." → "1.1". Standard: "K6: ..." / "S1: ..." → "K6" / "S1". */
export function extractCriterionCode(title: string): string {
  const trimmed = title.trim();
  const numeric = trimmed.match(/^(\d+(?:\.\d+)*)/);
  if (numeric?.[1]) return numeric[1];
  const alphaNum = trimmed.match(/^([A-Za-z]+\d+)/);
  if (alphaNum?.[1]) return alphaNum[1];
  return "";
}

/** @deprecated Use extractCriterionCode */
export function extractTopicCode(title: string): string {
  return extractCriterionCode(title);
}

export function compareTopicCodes(a: string, b: string): number {
  const aNum = /^(\d+(?:\.\d+)*)$/.test(a);
  const bNum = /^(\d+(?:\.\d+)*)$/.test(b);
  if (aNum && bNum) {
    const aParts = a.split(".").map((p) => Number(p));
    const bParts = b.split(".").map((p) => Number(p));
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i++) {
      const av = aParts[i];
      const bv = bParts[i];
      const aFinite = Number.isFinite(av);
      const bFinite = Number.isFinite(bv);
      if (aFinite && bFinite && av !== bv) return av - bv;
      if (aFinite && !bFinite) return -1;
      if (!aFinite && bFinite) return 1;
    }
    return 0;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}
