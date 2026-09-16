import type { UnitProgress } from "@/store/api/module-unit-progress/types";

/**
 * The learner-units endpoint only returns units the learner explicitly saved on
 * Choose Units. Standard courses never go through that screen, and a course edit
 * can regenerate unit ids so an older selection stops matching. In those cases we
 * rebuild the rows from the learner's own course JSON in Redux, which already
 * carries the same evidenceBoxes the API uses to derive progress.
 */

type UnknownRecord = Record<string, unknown>;

type EvidenceBox = { learnerMap?: boolean; trainerMap?: boolean };

type CompletionStatus = {
  learnerDone: boolean;
  trainerDone: boolean;
  fullyCompleted: boolean;
  partiallyCompleted: boolean;
};

function asRecords(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? (value as UnknownRecord[]) : [];
}

function evidenceBoxesOf(source: UnknownRecord): EvidenceBox[] {
  return asRecords(source.evidenceBoxes) as EvidenceBox[];
}

function getEvidenceFlags(boxes: EvidenceBox[]): CompletionStatus {
  const learnerDone = boxes.some((box) => Boolean(box?.learnerMap));
  const trainerDone = boxes.some((box) => Boolean(box?.trainerMap));
  const fullyCompleted = boxes.some(
    (box) => Boolean(box?.learnerMap) && Boolean(box?.trainerMap),
  );

  return {
    learnerDone,
    trainerDone,
    fullyCompleted,
    partiallyCompleted: learnerDone || trainerDone,
  };
}

function getSubUnitStatus(sub: UnknownRecord): CompletionStatus {
  const topics = asRecords(sub.topics);

  if (topics.length > 0) {
    const topicStatuses = topics.map((topic) =>
      getEvidenceFlags(evidenceBoxesOf(topic)),
    );

    return {
      learnerDone: topicStatuses.every((status) => status.learnerDone),
      trainerDone: topicStatuses.every((status) => status.trainerDone),
      fullyCompleted: topicStatuses.every((status) => status.fullyCompleted),
      partiallyCompleted: topicStatuses.some(
        (status) => status.partiallyCompleted,
      ),
    };
  }

  if (
    typeof sub.learnerMap === "boolean" ||
    typeof sub.trainerMap === "boolean"
  ) {
    const learnerDone = Boolean(sub.learnerMap);
    const trainerDone = Boolean(sub.trainerMap);

    return {
      learnerDone,
      trainerDone,
      fullyCompleted: learnerDone && trainerDone,
      partiallyCompleted: learnerDone || trainerDone,
    };
  }

  return getEvidenceFlags(evidenceBoxesOf(sub));
}

function getUnitCompletionStatus(unit: UnknownRecord): CompletionStatus {
  const subUnits = asRecords(unit.subUnit);

  if (subUnits.length > 0) {
    const subStatuses = subUnits.map(getSubUnitStatus);

    return {
      learnerDone: subStatuses.every((status) => status.learnerDone),
      trainerDone: subStatuses.every((status) => status.trainerDone),
      fullyCompleted: subStatuses.every((status) => status.fullyCompleted),
      partiallyCompleted: subStatuses.some(
        (status) => status.partiallyCompleted,
      ),
    };
  }

  return getEvidenceFlags(evidenceBoxesOf(unit));
}

function countEvidence(unit: UnknownRecord) {
  let total = 0;
  let learnerMapped = 0;
  let trainerMapped = 0;

  const countBox = (box: EvidenceBox) => {
    total += 1;
    if (box?.learnerMap) learnerMapped += 1;
    if (box?.trainerMap) trainerMapped += 1;
  };

  evidenceBoxesOf(unit).forEach(countBox);
  asRecords(unit.subUnit).forEach((sub) => {
    evidenceBoxesOf(sub).forEach(countBox);
    asRecords(sub.topics).forEach((topic) =>
      evidenceBoxesOf(topic).forEach(countBox),
    );
  });

  return { total, learnerMapped, trainerMapped };
}

function firstDefined(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function buildUnitProgressFromCourseUnits(units: unknown): UnitProgress[] {
  return asRecords(units).map((unit, index) => {
    const { total, learnerMapped, trainerMapped } = countEvidence(unit);
    const completion = getUnitCompletionStatus(unit);

    const learnerPercent =
      total > 0
        ? Math.round((learnerMapped / total) * 100)
        : completion.learnerDone
          ? 100
          : 0;

    const trainerPercent =
      total > 0
        ? Math.round((trainerMapped / total) * 100)
        : completion.trainerDone
          ? 100
          : 0;

    const unitId =
      firstDefined(unit, ["id", "unit_code", "unit_ref"]) ?? index + 1;

    return {
      ...unit,
      id: unitId as string | number,
      unit_id: unitId as string | number,
      title: String(
        firstDefined(unit, ["title", "unit_title", "name"]) ?? "",
      ),
      learner_progress_percent: learnerPercent,
      trainer_progress_percent: trainerPercent,
      learner_done: completion.learnerDone,
      trainer_done: completion.trainerDone,
      fully_completed: completion.fullyCompleted,
      partially_completed: completion.partiallyCompleted,
      assessed_date: firstDefined(unit, [
        "assessed_date",
        "assessedDate",
        "assessed_at",
        "assessedAt",
        "assessed",
      ]) as string | null,
      iqa_sign_off: firstDefined(unit, [
        "iqa_sign_off",
        "iqaSignOff",
        "iqa_signed_off",
        "iqaSignedOff",
      ]) as boolean | string | null,
    };
  });
}
