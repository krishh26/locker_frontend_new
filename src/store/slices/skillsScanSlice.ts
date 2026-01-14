import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CourseUnit } from "@/store/api/skills-scan/types";
import type { RootState } from "@/store";

export type SelectedCourse = {
  course: { course_id: string | number; course_name: string };
  start_date: string;
  end_date: string;
  progressByDate?: Array<{ date: string; isDisabled: boolean }>;
  user_course_id?: number;
} | null;

// Store the complete API response data structure
// Based on actual API response: data.data contains user_course_id, course object, and other metadata
export type CourseData = {
  // Top-level fields from API response
  user_course_id?: number;
  start_date?: string;
  end_date?: string;
  predicted_grade?: string | null;
  final_grade?: string | null;
  course_status?: string;
  is_main_course?: boolean;
  created_at?: string;
  updated_at?: string;
  // Course object containing full course details
  course?: {
    course_id?: string | number;
    course_name?: string;
    course_code?: string;
    level?: string;
    sector?: string | null;
    recommended_minimum_age?: string | null;
    total_credits?: string | null;
    operational_start_date?: string;
    guided_learning_hours?: string | null;
    brand_guidelines?: string | null;
    overall_grading_type?: string | null;
    course_type?: string | null;
    course_core_type?: string;
    units?: CourseUnit[];
    assigned_gateway_id?: string | null;
    assigned_gateway_name?: string | null;
    checklist?: unknown[];
    assigned_standards?: unknown[];
    awarding_body?: string;
    questions?: unknown[];
    exclude_from_otj?: boolean;
    updated_at?: string;
    active?: boolean;
    duration_value?: number;
    duration_period?: string;
    included_in_off_the_job?: boolean;
    assessment_plan_link?: string | null;
    two_page_standard_link?: string | null;
    created_at?: string;
  };
  // For some response structures: data.units contains units directly (fallback)
  units?: CourseUnit[];
  // Common fields
  course_core_type?: string;
} | null;

type SkillsScanState = {
  selectedCourse: SelectedCourse;
  courseData: CourseData;
  selectedUnit: CourseUnit | null;
};

const initialState: SkillsScanState = {
  selectedCourse: null,
  courseData: null,
  selectedUnit: null,
};

const skillsScanSlice = createSlice({
  name: "skillsScan",
  initialState,
  reducers: {
    setSelectedCourse: (state, action: PayloadAction<SelectedCourse>) => {
      state.selectedCourse = action.payload;
      // Clear courseData and selectedUnit when course changes
      if (!action.payload) {
        state.courseData = null;
        state.selectedUnit = null;
      }
    },
    setCourseData: (state, action: PayloadAction<CourseData>) => {
      state.courseData = action.payload;
      // Set first unit as selected when courseData is loaded
      // Handle both structures: data.course.units or data.units
      const units = action.payload?.course?.units || action.payload?.units || [];
      if (units.length > 0) {
        state.selectedUnit = units[0];
      } else {
        state.selectedUnit = null;
      }
    },
    setSelectedUnit: (state, action: PayloadAction<CourseUnit | null>) => {
      state.selectedUnit = action.payload;
    },
    updateCourseDataUnits: (state, action: PayloadAction<CourseUnit[]>) => {
      if (state.courseData) {
        // Update units in the appropriate location based on structure
        if (state.courseData.course) {
          // Qualification course structure: update data.course.units
          state.courseData.course.units = action.payload;
        } else {
          // Standard course structure: update data.units
          state.courseData.units = action.payload;
        }
        // Update selectedUnit if it exists in the updated units
        if (state.selectedUnit) {
          const updatedUnit = action.payload.find(
            (u) => u.id === state.selectedUnit?.id
          );
          if (updatedUnit) {
            state.selectedUnit = updatedUnit;
          }
        }
      }
    },
    clearSkillsScanState: (state) => {
      state.selectedCourse = null;
      state.courseData = null;
      state.selectedUnit = null;
    },
  },
});

export const {
  setSelectedCourse,
  setCourseData,
  setSelectedUnit,
  updateCourseDataUnits,
  clearSkillsScanState,
} = skillsScanSlice.actions;

// Selectors
export const selectSelectedCourse = (state: RootState) =>
  state.skillsScan.selectedCourse;
export const selectCourseData = (state: RootState) => state.skillsScan.courseData;
export const selectSelectedUnit = (state: RootState) =>
  state.skillsScan.selectedUnit;

export default skillsScanSlice.reducer;

