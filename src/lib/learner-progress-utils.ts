import type { LearnerCourse, LearnerListItem } from "@/store/api/learner/types";
import { isEnrollmentExcluded } from "@/lib/is-enrollment-excluded";

/** Sub-unit / topic row with optional mapping flags (list payloads mirror evidence tree). */
type MapLike = { learnerMap?: boolean; trainerMap?: boolean };

type SubUnitNode = MapLike & { topics?: MapLike[] };

type UnitNode = MapLike & { subUnit?: SubUnitNode[] };

function topicHasExplicitMap(topic: MapLike): boolean {
  return topic.learnerMap !== undefined || topic.trainerMap !== undefined;
}

/** Topics without explicit flags inherit the parent sub-unit’s mapping (Qualification payloads). */
function topicLeafFlags(topic: MapLike, sub: MapLike): { l: boolean; t: boolean } {
  if (!topicHasExplicitMap(topic)) {
    return { l: Boolean(sub.learnerMap), t: Boolean(sub.trainerMap) };
  }
  return { l: Boolean(topic.learnerMap), t: Boolean(topic.trainerMap) };
}

function leafComplete(flags: { l: boolean; t: boolean }): boolean {
  return flags.l && flags.t;
}

function leafAny(flags: { l: boolean; t: boolean }): boolean {
  return flags.l || flags.t;
}

function subUnitStatus(sub: SubUnitNode): "full" | "partial" | "none" {
  const topics = sub.topics;
  if (!Array.isArray(topics) || topics.length === 0) {
    const f = { l: Boolean(sub.learnerMap), t: Boolean(sub.trainerMap) };
    if (!leafAny(f)) return "none";
    return leafComplete(f) ? "full" : "partial";
  }
  let any = false;
  let allFull = true;
  for (const topic of topics) {
    const fl = topicLeafFlags(topic, sub);
    if (leafAny(fl)) any = true;
    if (!leafComplete(fl)) allFull = false;
  }
  if (!any) return "none";
  return allFull ? "full" : "partial";
}

function unitStatusFromTree(unit: UnitNode): "full" | "partial" | "none" {
  const subs = unit.subUnit;
  if (!Array.isArray(subs) || subs.length === 0) {
    const f = { l: Boolean(unit.learnerMap), t: Boolean(unit.trainerMap) };
    if (!leafAny(f)) return "none";
    return leafComplete(f) ? "full" : "partial";
  }
  const statuses = subs.map(subUnitStatus);
  if (statuses.every((s) => s === "full")) return "full";
  if (statuses.some((s) => s === "full" || s === "partial")) return "partial";
  return "none";
}

function inferUnitCountsFromCourseUnits(units: unknown[]): {
  fullyCompleted: number;
  unitsPartiallyCompleted: number;
  unitsNotStarted: number;
  totalUnits: number;
} {
  let fullyCompleted = 0;
  let unitsPartiallyCompleted = 0;
  let unitsNotStarted = 0;
  for (const raw of units) {
    const st = unitStatusFromTree(raw as UnitNode);
    if (st === "full") fullyCompleted += 1;
    else if (st === "partial") unitsPartiallyCompleted += 1;
    else unitsNotStarted += 1;
  }
  return {
    fullyCompleted,
    unitsPartiallyCompleted,
    unitsNotStarted,
    totalUnits: units.length,
  };
}

/**
 * `/learner/list` often returns all units as “not started” while `course.units` carries the
 * real learner/trainer flags. Infer from the tree only in that pattern so we do not override
 * trustworthy API aggregates (see learner dashboard).
 */
function shouldInferProgressFromUnits(
  apiFully: number,
  apiPartial: number,
  apiNotStarted: number,
  apiTotalUnits: number,
  unitsLen: number,
): boolean {
  if (unitsLen <= 0 || apiTotalUnits <= 0) return false;
  if (apiTotalUnits !== unitsLen) return false;
  return apiFully === 0 && apiPartial === 0 && apiNotStarted === apiTotalUnits;
}

/**
 * Several non-negative triples (completed, inProgress, notStarted) yield the same
 * `completionPercentage` because in-progress counts half. Prefer the triple with the
 * smallest in-progress count (then smallest not-started), matching backend / dashboard
 * when the API reports 0 in-progress (e.g. 6 / 0 / 1 vs 5 / 2 / 0 at 7 units).
 */
function canonicalProgressBuckets(
  completed: number,
  inProgress: number,
  notStarted: number,
): { completed: number; inProgress: number; notStarted: number } {
  const total = completed + inProgress + notStarted;
  if (total <= 0) {
    return { completed, inProgress, notStarted };
  }
  const wHalf = 2 * completed + inProgress;
  for (let i = 0; i <= total; i += 1) {
    const rem = wHalf - i;
    if (rem < 0 || rem % 2 !== 0) continue;
    const c = rem / 2;
    const n = total - c - i;
    if (c >= 0 && n >= 0 && Number.isInteger(c)) {
      return { completed: c, inProgress: i, notStarted: n };
    }
  }
  return { completed, inProgress, notStarted };
}

export interface ProgressData {
  yetToComplete: number;
  fullyCompleted: number;
  workInProgress: number;
  totalUnits: number;
  duration: number;
  totalDuration: number;
  dayPending: number;
}

export interface LearnerProgressSummary {
  totalCompleted: number;
  totalInProgress: number;
  totalNotStarted: number;
  totalUnits: number;
  completionPercentage: number;
}

/**
 * Converts a course's progress data to a standardized matrix format
 */
export function convertToMatrixData(data: LearnerCourse): ProgressData {
  if (!data) {
    return {
      yetToComplete: 0,
      fullyCompleted: 0,
      workInProgress: 0,
      totalUnits: 0,
      duration: 0,
      totalDuration: 0,
      dayPending: 0,
    };
  }

  // Gateway questions-based progress
  try {
    const coreType = data?.course_core_type || data?.course?.course_core_type;
    const isGateway = coreType === "Gateway";
    const courseData = data?.course as LearnerCourse["course"] & {
      questions?: Array<{ achieved?: boolean }>;
    };
    const questions = Array.isArray(courseData?.questions)
      ? courseData.questions
      : Array.isArray(data?.questions)
      ? data.questions
      : [];

    if (isGateway && questions && questions.length > 0) {
      const totalUnits = questions.length;
      const fullyCompleted = questions.filter(
        (q: { achieved?: boolean }) => q?.achieved === true
      ).length;

      let duration = 0;
      let totalDuration = 1;
      let dayPending = 0;
      if (data.start_date && data.end_date) {
        const startDate = new Date(data.start_date);
        const endDate = new Date(data.end_date);
        const currentDate = new Date();
        totalDuration = Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
        duration = Math.max(
          0,
          Math.ceil(
            (currentDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        dayPending = Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );
      }

      return {
        yetToComplete: Math.max(0, totalUnits - fullyCompleted),
        fullyCompleted,
        workInProgress: 0,
        totalUnits,
        duration,
        totalDuration,
        dayPending,
      };
    }
  } catch {
    // Fall through to default calculation
  }

  // Calculate duration from start and end dates
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const currentDate = new Date();
  const totalDuration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const duration = Math.ceil(
    (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dayPending = Math.ceil(
    (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const unitsRaw = (data.course as { units?: unknown[] } | undefined)?.units;
  const units = Array.isArray(unitsRaw) ? unitsRaw : [];

  let yetToComplete = data.unitsNotStarted || 0;
  let fullyCompleted = data.unitsFullyCompleted || 0;
  let workInProgress = data.unitsPartiallyCompleted || 0;
  let totalUnits = data.totalUnits || 0;

  if (
    shouldInferProgressFromUnits(
      fullyCompleted,
      workInProgress,
      yetToComplete,
      totalUnits,
      units.length,
    )
  ) {
    const inferred = inferUnitCountsFromCourseUnits(units);
    const canon = canonicalProgressBuckets(
      inferred.fullyCompleted,
      inferred.unitsPartiallyCompleted,
      inferred.unitsNotStarted,
    );
    fullyCompleted = canon.completed;
    workInProgress = canon.inProgress;
    yetToComplete = canon.notStarted;
    totalUnits = inferred.totalUnits;
  }

  return {
    yetToComplete,
    fullyCompleted,
    workInProgress,
    totalUnits,
    duration: Math.max(0, duration),
    totalDuration: Math.max(1, totalDuration),
    dayPending: Math.max(0, dayPending),
  };
}

/**
 * Calculates combined progress summary for a learner across all their courses
 */
export function calculateLearnerProgress(
  learner: LearnerListItem
): LearnerProgressSummary {
  let totalCompleted = 0;
  let totalInProgress = 0;
  let totalNotStarted = 0;
  let totalUnitsAll = 0;

  const courses = (learner?.course ?? []).filter((c) => !isEnrollmentExcluded(c));
  if (courses.length > 0) {
    courses.forEach((course) => {
      const progressData = convertToMatrixData(course);
      totalCompleted += progressData.fullyCompleted;
      totalInProgress += progressData.workInProgress;
      totalNotStarted += progressData.yetToComplete;
      totalUnitsAll += progressData.totalUnits;
    });
  }

  const completionPercentage =
    totalUnitsAll > 0
      ? (totalCompleted / totalUnitsAll) * 100 +
        (totalInProgress / totalUnitsAll) * 50
      : 0;

  return {
    totalCompleted,
    totalInProgress,
    totalNotStarted,
    totalUnits: totalUnitsAll,
    completionPercentage,
  };
}

/**
 * Returns individual progress percentages for completed, in progress, and not started
 */
export function getProgressPercentages(progress: LearnerProgressSummary): {
  completedPercent: number;
  inProgressPercent: number;
  notStartedPercent: number;
} {
  const { totalCompleted, totalInProgress, totalNotStarted, totalUnits } = progress;
  
  if (totalUnits === 0) {
    return {
      completedPercent: 0,
      inProgressPercent: 0,
      notStartedPercent: 0,
    };
  }

  return {
    completedPercent: Math.round((totalCompleted / totalUnits) * 100),
    inProgressPercent: Math.round((totalInProgress / totalUnits) * 100),
    notStartedPercent: Math.round((totalNotStarted / totalUnits) * 100),
  };
}
