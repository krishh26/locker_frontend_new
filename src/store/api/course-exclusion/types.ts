/** GET /course/exclusion query params */
export interface CourseExclusionGetArg {
  organisation_id: number;
  course_id?: number;
}

export interface CourseExclusionRecord {
  organisation_id?: number;
  course_id?: number;
  is_excluded: boolean;
}

/** Raw API envelope (data may be one record or a list when filtering) */
export interface CourseExclusionGetResponse {
  status: boolean;
  data?: CourseExclusionRecord | CourseExclusionRecord[];
  message?: string;
  error?: string;
}

/** Normalized query result for hooks/components */
export interface CourseExclusionResponse {
  status: boolean;
  data?: CourseExclusionRecord;
  message?: string;
  error?: string;
}

export interface UpdateCourseExclusionRequest {
  organisation_id: number;
  course_id: number;
  is_excluded: boolean;
}
