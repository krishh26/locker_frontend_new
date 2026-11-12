import type { SimpleFormField } from "@/store/api/forms/types";
import { TODAY_DATE_PRESET } from "@/components/forms/field-types";

export interface PresetField {
  type: string;
  label: string;
  field: SimpleFormField;
}

export interface RolePresets {
  learner: PresetField[];
  trainer: PresetField[];
  lineManager: PresetField[];
  employee: PresetField[];
  course: PresetField[];
  general: PresetField[];
}

export const roleIcons: Record<string, string> = {
  learner: "🧑‍🎓",
  trainer: "🧑‍🏫",
  lineManager: "🧑‍💼",
  employee: "👨‍💼",
  course: "📚",
  general: "🗓️",
};

const coursePreset = (
  type: string,
  label: string,
  presetField: string,
  fieldType: "text" | "date" = "text"
): PresetField => ({
  type,
  label,
  field: {
    id: type,
    type: fieldType,
    label,
    required: false,
    presetField,
    width: "half",
  },
});

// Simplified preset fields - focusing on most common ones
export const PRESET_FIELDS: RolePresets = {
  learner: [
    {
      type: "learner-name",
      label: "Learner Name",
      field: {
        id: "learner-name",
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true,
        presetField: "learnerFullName",
        width: "full",
      },
    },
    {
      type: "learner-email",
      label: "Learner Email",
      field: {
        id: "learner-email",
        type: "email",
        label: "Email Address",
        placeholder: "Enter your email",
        required: true,
        presetField: "LearnerEmail",
        width: "full",
      },
    },
    {
      type: "learner-phone",
      label: "Learner Phone",
      field: {
        id: "learner-phone",
        type: "phone",
        label: "Phone Number",
        placeholder: "Enter your phone number",
        required: true,
        presetField: "LearnerPhoneNumber",
        width: "full",
      },
    },
    {
      type: "date_of_birth",
      label: "Date of Birth",
      field: {
        id: "dob",
        type: "date",
        label: "Date of Birth",
        required: false,
        presetField: "dob",
        width: "half",
      },
    },
    {
      type: "learner-uln",
      label: "ULN",
      field: {
        id: "learner-uln",
        type: "text",
        label: "ULN",
        required: false,
        presetField: "uln",
        width: "half",
      },
    },
    {
      type: "employer",
      label: "Employer",
      field: {
        id: "employer",
        type: "text",
        label: "Employer",
        required: true,
        presetField: "employer",
        width: "full",
      },
    },
  ],
  trainer: [
    {
      type: "trainer-name",
      label: "Trainer Name",
      field: {
        id: "trainer-name",
        type: "text",
        label: "Trainer Name",
        placeholder: "Enter your name",
        presetField: "TrainerFullName",
        width: "full",
      },
    },
    {
      type: "email",
      label: "Email",
      field: {
        id: "email",
        type: "email",
        label: "Email",
        placeholder: "Enter your email",
        presetField: "TrainerEmail",
        width: "full",
      },
    },
  ],
  lineManager: [
    {
      type: "line-manager-name",
      label: "Line Manager Name",
      field: {
        id: "line-manager-name",
        type: "text",
        label: "Line Manager Name",
        presetField: "LineManagerFullName",
        width: "half",
      },
    },
    {
      type: "line-manager-email",
      label: "Line Manager Email",
      field: {
        id: "line-manager-email",
        type: "email",
        label: "Line Manager Email",
        presetField: "LineManagerEmail",
        width: "half",
      },
    },
    {
      type: "line-manager-phone",
      label: "Line Manager Contact Number",
      field: {
        id: "line-manager-phone",
        type: "phone",
        label: "Line Manager Contact Number",
        presetField: "LineManagerPhone",
        width: "half",
      },
    },
  ],
  employee: [
    {
      type: "employee-name",
      label: "Employee Name",
      field: {
        id: "employee-name",
        type: "text",
        label: "Employee Name",
        placeholder: "Enter your name",
        presetField: "EmployeeName",
        width: "full",
      },
    },
  ],
  course: [
    coursePreset("course-name", "Course Name", "courseName"),
    coursePreset("course-code", "Course Code", "courseCode"),
    coursePreset("course-level", "Course Level", "courseLevel"),
    coursePreset("course-sector", "Sector", "courseSector"),
    coursePreset("course-awarding-body", "Awarding Body", "courseAwardingBody"),
    coursePreset("course-type", "Course Type", "courseType"),
    coursePreset("course-glh", "Guided Learning Hours", "courseGuidedLearningHours"),
    coursePreset("course-total-credits", "Total Credits", "courseTotalCredits"),
    coursePreset("course-duration", "Course Duration", "courseDuration"),
    coursePreset("course-start-date", "Start Date", "courseStartDate", "date"),
    coursePreset("course-end-date", "Expected End Date", "courseEndDate", "date"),
    coursePreset("course-status", "Course Status", "courseStatus"),
    coursePreset("course-predicted-grade", "Predicted Grade", "coursePredictedGrade"),
    coursePreset("course-final-grade", "Final Grade", "courseFinalGrade"),
    coursePreset("course-iqa", "IQA", "courseIQA"),
    coursePreset("course-employer", "Employer", "courseEmployer"),
  ],
  general: [
    {
      type: "today-date",
      label: "Today's Date",
      field: {
        id: "today-date",
        type: "date",
        label: "Date",
        required: false,
        presetField: TODAY_DATE_PRESET,
        width: "half",
      },
    },
  ],
};

