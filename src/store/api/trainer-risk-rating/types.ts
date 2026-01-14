export interface TrainerRiskRatingInfo {
  id: number;
  high_percentage: number | string;
  medium_percentage: number | string;
  low_percentage: number | string;
  assessment_methods: Record<string, AssessmentMethodRisk>;
}

export interface AssessmentMethodRisk {
  assessment_method: string;
  risk_level: string;
}

export interface CourseRiskRating {
  course_id: number;
  overall_risk_level: string;
}

export interface Course {
  course_id: number;
  course_name: string;
  risk_rating: {
    overall_risk_level: string;
  };
  comment?: string;
}

export interface TrainerDetailsData {
  risk_rating_info: TrainerRiskRatingInfo;
  courses: Course[];
  assessment_methods?: Record<string, string>;
}

export interface TrainerDetailsResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: TrainerDetailsData;
}

export interface SaveRiskSettingsRequest {
  trainer_id: number;
  high_percentage: number;
  medium_percentage: number;
  low_percentage: number;
  courses: CourseRiskRating[];
}

export interface SaveRiskSettingsResponse {
  status: boolean;
  message?: string;
  error?: string;
}

export interface SaveCourseRiskRatingsRequest {
  trainer_id: number;
  high_percentage?: number;
  medium_percentage?: number;
  low_percentage?: number;
  courses?: CourseRiskRating[];
  assessment_methods?: Array<{
    assessment_method: string;
    risk_level: string;
  }>;
}

export interface SaveCourseRiskRatingsResponse {
  status: boolean;
  message?: string;
  error?: string;
}

export interface SaveCourseCommentRequest {
  course_comments: {
    course_id: number;
    comment: string;
  };
}

export interface SaveCourseCommentResponse {
  status: boolean;
  message?: string;
  error?: string;
}

