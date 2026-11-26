import { format, isValid } from "date-fns";
import type { LearnerCourse, LearnerData } from "@/store/api/learner/types";
import { convertToMatrixData } from "@/lib/learner-progress-utils";

type PresetValue = string | number | null | undefined;

type PersonRef = {
  first_name?: string;
  last_name?: string;
  user_name?: string;
  email?: string;
  mobile?: string;
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

// The learner API sends employer_id as a plain id and the name as employer_name.
const learnerEmployerName = (learner: LearnerData): string | undefined => {
  const employer = learner.employer_id as { employer_name?: string } | null | undefined;
  return (
    asText(learner.employer_name) ??
    (employer && typeof employer === "object" ? asText(employer.employer_name) : undefined)
  );
};

/** Learner group presets, read from the learner record (not the logged-in user). */
export const buildLearnerPresetMap = (
  learner: LearnerData | null | undefined
): Record<string, PresetValue> => {
  if (!learner) return {};
  const fullName = personName(learner as PersonRef);
  return {
    learnerFullName: fullName,
    LearnerEmail: asText(learner.email),
    LearnerPhoneNumber: asText(learner.mobile ?? learner.telephone),
    uln: asText(learner.uln),
    dob: toDateInputValue(learner.dob),
    employer: learnerEmployerName(learner),
    EmployeeName: fullName,
  };
};

/** Same completion % as the learner dashboard: full units count 100%, partial units 50%. */
const courseProgressPercent = (course: LearnerCourse): string | undefined => {
  const { fullyCompleted, workInProgress, totalUnits } = convertToMatrixData(course);
  if (!totalUnits) return undefined;
  const percent = (fullyCompleted / totalUnits) * 100 + (workInProgress / totalUnits) * 50;
  return `${Math.round(Math.min(Math.max(percent, 0), 100))}%`;
};

export const getMainCourse =(learner: LearnerData | null | undefined): LearnerCourse | undefined => {
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
  const trainer = main.trainer_id as PersonRef;
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
    courseProgress: courseProgressPercent(main),
    coursePredictedGrade: asText(main.predicted_grade),
    courseFinalGrade: asText(main.final_grade),
    // Older forms still reference courseTrainer; new forms use the Trainer group.
    courseTrainer: personName(trainer),
    courseIQA: personName(main.IQA_id as PersonRef),
    // Falls back to the learner's employer when the enrolment has none of its own.
    courseEmployer:
      asText(employer?.employer?.employer_name) ??
      personName(employer) ??
      (learner ? learnerEmployerName(learner) : undefined),
    TrainerFullName: personName(trainer),
    TrainerEmail: asText(trainer?.email),
  };
};

export const buildLineManagerPresetMap = (
  learner: LearnerData | null | undefined
): Record<string, PresetValue> => ({
  LineManagerFullName: asText(learner?.line_manager_name),
  LineManagerEmail: asText(learner?.line_manager_email),
  LineManagerPhone: asText(learner?.line_manager_mobile),
});
