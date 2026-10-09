import { format, isValid } from "date-fns";
import type { LearnerCourse, LearnerData } from "@/store/api/learner/types";

type PresetValue = string | number | null | undefined;

type PersonRef = {
  first_name?: string;
  last_name?: string;
  user_name?: string;
  employer?: { employer_name?: string } | null;
} | null | undefined;

export const toDateInputValue = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return isValid(date) ? format(date, "yyyy-MM-dd") : undefined;
};

export const getTodayDateValue = (): string => format(new Date(), "yyyy-MM-dd");

const personName = (person: PersonRef): string | undefined => {
  if (!person) return undefined;
  const full = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  return full || person.user_name || undefined;
};

const asText = (value: unknown): string | undefined =>
  value === null || value === undefined || value === "" ? undefined : String(value);

export const getMainCourse = (learner: LearnerData | null | undefined): LearnerCourse | undefined => {
  const courses = learner?.course ?? [];
  return courses.find((c) => c.is_main_course) ?? courses[0];
};

export const buildCoursePresetMap = (
  learner: LearnerData | null | undefined
): Record<string, PresetValue> => {
  const main = getMainCourse(learner);
  if (!main) return {};

  const course = (main.course ?? {}) as Record<string, unknown>;
  const employer = main.employer_id as PersonRef;
  const duration = [course.duration_value, course.duration_period]
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ");

  return {
    courseName: asText(course.course_name),
    courseCode: asText(course.course_code),
    courseLevel: asText(course.level),
    courseSector: asText(course.sector),
    courseAwardingBody: asText(course.awarding_body),
    courseType: asText(course.course_core_type ?? course.course_type),
    courseGuidedLearningHours: asText(course.guided_learning_hours),
    courseTotalCredits: asText(course.total_credits),
    courseDuration: asText(duration),
    courseStartDate: toDateInputValue(main.start_date),
    courseEndDate: toDateInputValue(main.end_date),
    courseStatus: asText(main.course_status),
    coursePredictedGrade: asText(main.predicted_grade),
    courseFinalGrade: asText(main.final_grade),
    courseTrainer: personName(main.trainer_id as PersonRef),
    courseIQA: personName(main.IQA_id as PersonRef),
    courseEmployer: asText(employer?.employer?.employer_name) ?? personName(employer),
  };
};
