export type LearnerCourse = {
  user_course_id: number;
  course: {
    course_id: number;
    course_name: string;
    course_code: string;
    level: string;
    sector: string;
    recommended_minimum_age: string;
    total_credits: string;
    operational_start_date: string;
    guided_learning_hours: string;
    brand_guidelines: string;
    course_type: string | null;
    course_core_type: string | null;
  };
  start_date: string;
  end_date: string;
  course_status: string;
  is_main_course: boolean;
  // Progress fields
  unitsNotStarted?: number;
  unitsFullyCompleted?: number;
  unitsPartiallyCompleted?: number;
  totalUnits?: number;
  course_core_type?: string | null;
  questions?: Array<{ achieved?: boolean }>;
  [key: string]: unknown;
};

export interface Avatar {
  key: string;
  url: string;
}

export type LearnerData = {
  learner_id: number;
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  mobile: string;
  role?: string;
  national_ins_no: string;
  funding_body: string;
  avatar?: Avatar | null;
  custom_funding_data?: {
    original_amount: number;
    custom_amount: number;
    funding_band_id: number;
    updated_by_learner: boolean;
    updated_at: string;
  };
  course: LearnerCourse[];
  [key: string]: unknown;
};

export type LearnerResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: LearnerData;
};

export interface LearnerListItem {
  learner_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  course?: LearnerCourse[];
  comment?: string;
  status?: string;
  funding_body?: string;
  national_ins_no?: string;
  job_title?: string;
  employer_id?: {
    employer_id: number;
    employer_name: string;
  };
  avatar?: Avatar | null;
  user_id?: {
    avatar?: Avatar;
  };
  next_visit_date?: string | null;
  updated_at?: string | null;
}

export interface LearnerFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
  course_id?: number;
  employer_id?: number;
  employer_ids?: string | number;
  centre_id?: number;
  status?: string;
  user_id?: number;
  role?: string;
}

export interface LearnerListResponse {
  message: string;
  status: boolean;
  data: LearnerListItem[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
  error?: string;
}

export interface CreateLearnerRequest {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  mobile: string;
  employer_id: string;
  funding_body: string;
  national_ins_no?: string;
  job_title: string;
  comment?: string;
  organisation_id?: number;
  centre_id?: number;
}

export interface UpdateLearnerRequest {
  first_name?: string;
  last_name?: string;
  user_name?: string;
  email?: string;
  mobile?: string;
  employer_id?: string;
  funding_body?: string;
  national_ins_no?: string;
  job_title?: string;
  comment?: string;
  isShowMessage?: boolean;
  organisation_id?: number;
  centre_id?: number;
}

export interface UpdateLearnerCommentRequest {
  comment: string;
}

export interface BulkCreateLearnerRequest {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  national_ins_no?: string;
  funding_body: string;
  employer_name?: string;
  courses: Array<{
    course_name: string;
    start_date?: string;
    end_date?: string;
    trainer_name?: string;
    iqa_name?: string;
    employer_name?: string;
  }>;
}

export interface BulkCreateLearnersRequest {
  learners: BulkCreateLearnerRequest[];
}

export interface BulkCreateLearnersResponse {
  message: string;
  status: boolean;
  data?: {
    createdCount?: number;
    errors?: Array<{
      row?: number;
      message?: string;
      [key: string]: unknown;
    }>;
  };
}

export interface UploadFileResponse {
  status: boolean;
  message?: string;
  data?: Avatar;
  error?: string;
}

export interface CreateUserCourseRequest {
  learner_id: number;
  course_id: number;
  trainer_id: number;
  IQA_id: number;
  LIQA_id: number;
  EQA_id: number;
  start_date: string;
  end_date: string;
  predicted_grade: string;
  final_grade: string;
  is_main_course?: boolean;
  course_status?: string;
}

export interface UpdateUserCourseRequest {
  trainer_id?: number;
  IQA_id?: number;
  LIQA_id?: number;
  EQA_id?: number;
  start_date?: string;
  end_date?: string;
  predicted_grade?: string;
  final_grade?: string;
  is_main_course?: boolean;
  course_status?: string;
}

export interface UserCourseResponse {
  status: boolean;
  message?: string;
  data?: LearnerCourse;
  error?: string;
}

export interface AssignEqaToCourseRequest {
  course_id: number;
  eqa_id: number;
  learner_ids: number[];
  action: "assign" | "unassign";
}

export interface AssignEqaToCourseResponse {
  status: boolean;
  message?: string;
  error?: string;
}

export interface AssignedLearnerResponse {
  status: boolean;
  message?: string;
  data?: Array<{
    user_course_id: number;
    course: {
      course_id: number;
      course_name: string;
      [key: string]: unknown;
    };
    start_date: string;
    end_date: string;
    course_status: string;
    learner_id: {
      learner_id: number;
      first_name: string;
      last_name: string;
      user_name: string;
      email: string;
      [key: string]: unknown;
    };
    trainer_id?: {
      user_id: number;
      user_name: string;
      first_name: string;
      last_name: string;
      email: string;
      mobile?: string;
      roles?: string[];
      avatar?: {
        key: string;
        url: string;
      };
      password_changed?: boolean;
      time_zone?: string;
      status?: string;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
      [key: string]: unknown;
    };
    IQA_id?: {
      user_id: number;
      user_name: string;
      first_name: string;
      last_name: string;
      email: string;
      mobile?: string;
      roles?: string[];
      avatar?: {
        key: string;
        url: string;
      };
      password_changed?: boolean;
      time_zone?: string;
      status?: string;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
      [key: string]: unknown;
    };
    learner_created?: string;
    course_registered?: string;
    iqa_report?: string;
    [key: string]: unknown;
  }>;
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    total: number;
  };
  error?: string;
}
