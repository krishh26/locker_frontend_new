import type { LearnerCourse, LearnerData } from "./types";

/** Soft-deleted courses are marked active=false on the nested course snapshot. */
export const isActiveLearnerCourse = (enrollment: LearnerCourse): boolean =>
  enrollment?.course?.active !== false;

export const filterActiveLearnerCourses = (
  courses: LearnerCourse[] | null | undefined,
): LearnerCourse[] => {
  if (!courses?.length) return courses ?? [];
  return courses.filter(isActiveLearnerCourse);
};

export const withActiveLearnerCourses = <T extends { course?: LearnerCourse[] }>(
  learner: T,
): T => {
  if (!learner?.course) return learner;
  return {
    ...learner,
    course: filterActiveLearnerCourses(learner.course),
  };
};

export const withActiveLearnerData = (data: LearnerData): LearnerData =>
  withActiveLearnerCourses(data);
