/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CourseUnit {
  id: string;
  title: string;
}

export interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  course_core_type: string;
  level: string;
  sector: string;
  guided_learning_hours: string;
  total_credits?: string;
  operational_start_date?: string;
  recommended_minimum_age?: string;
  qualification_status?: string;
  qualification_type?: string;
  course_type?: string;
  brand_guidelines?: string;
  overall_grading_type?: string;
  active?: boolean;
  organisation_id?: number;
  created_at?: string;
  updated_at?: string;
  units?: CourseUnit[];
}

export interface CourseFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
  core_type?: string;
}

export interface CourseListResponse {
  message: string;
  status: boolean;
  data: Course[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
  error?: string;
}

export interface CourseResponse {
  message: string;
  status: boolean;
  data: Course;
  error?: string;
}

export type CourseCoreType = "Qualification" | "Standard" | "Gateway";

export interface CourseFormData {
  course_name: string;
  course_code: string;
  course_type?: string;
  course_core_type: CourseCoreType;
  level: string;
  sector?: string;
  qualification_type?: string;
  qualification_status?: string;
  guided_learning_hours?: string;
  total_credits?: string;
  duration_period?: string;
  duration_value?: number | null;
  operational_start_date?: string;
  recommended_minimum_age?: string;
  overall_grading_type?: string;
  permitted_delivery_types?: string;
  professional_certification?: string;
  two_page_standard_link?: string;
  assessment_plan_link?: string;
  brand_guidelines?: string;
  active?: boolean;
  included_in_off_the_job?: boolean;
  awarding_body?: string;
  assigned_gateway_id?: number | null;
  assigned_gateway_name?: string;
  organisation_id?: number;
  questions?: any[];
  assigned_standards?: number[];
  units?: any[];
  [key: string]: any;
}

export interface CourseCreateRequest {
  data: CourseFormData;
}

export interface CourseUpdateRequest {
  id: number;
  data: CourseFormData;
}

export interface CourseCreateResponse {
  message: string;
  status: boolean;
  data: Course;
  error?: string;
}

export interface CourseUpdateResponse {
  message: string;
  status: boolean;
  data: Course;
  error?: string;
}
