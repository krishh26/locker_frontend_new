import type { LearnerCourse, LearnerListItem } from "@/store/api/learner/types";

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

  return {
    yetToComplete: data.unitsNotStarted || 0,
    fullyCompleted: data.unitsFullyCompleted || 0,
    workInProgress: data.unitsPartiallyCompleted || 0,
    totalUnits: data.totalUnits || 0,
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

  if (learner?.course && learner.course.length > 0) {
    learner.course.forEach((course) => {
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
