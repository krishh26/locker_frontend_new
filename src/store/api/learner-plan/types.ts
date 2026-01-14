export interface SessionParticipant {
  learner_id: number;
  user_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface SessionCourse {
  course_id: number;
  course_name: string;
  units?: Array<{
    unit_id: number;
    unit_name: string;
  }>;
}

export interface ParticipantCourseMapping {
  learner_id: number;
  courses: number[];
}

export interface SessionActionDetail {
  action_id: number;
  action_name?: string;
  action_description: string;
  target_date: string;
  job_type: string;
  unit?: string | null;
  time_spent?: number | null;
  trainer_feedback?: string | null;
  learner_feedback?: string | null;
  status?: boolean | string;
  learner_status?: string;
  trainer_status?: string;
  who?: string;
  employer?: string;
  sessionLearner?: string;
  file_attachment?: {
    file_id: number;
    file_name: string;
    file_url: string;
  } | null;
  added_by?: {
    user_id: number;
    user_name: string;
    first_name: string;
    last_name: string;
  };
  created_at?: string;
}

export interface SessionDocument {
  document_id: number;
  file_type: string;
  upload_type: "File Upload" | "Form Selection";
  name?: string;
  uploaded_files?: Array<{
    file_name: string;
    file_size: number;
    file_url: string;
    s3_key: string;
    uploaded_at: string;
  }>;
  selected_form?: {
    id: number;
    form_name: string;
  };
}

export interface LearningPlanSession {
  learner_plan_id: number;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  Duration: string;
  type: string;
  assessor_id?: {
    user_id?: number;
    user_name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  Attended?: string | null;
  learners?: SessionParticipant[];
  courses?: SessionCourse[];
  participant_course_mapping?: ParticipantCourseMapping[];
  sessionLearnerActionDetails?: SessionActionDetail[];
  learnerPlanDocuments?: SessionDocument[];
  feedback?: string;
  file_attachments?: Array<{
    file_id: number;
    file_name: string;
    file_url: string;
  }>;
}

export interface LearningPlanListRequest {
  learners: string | number;
  type?: string;
  Attended?: string;
  meta?: boolean;
}

export interface LearningPlanListResponse {
  status: boolean;
  data: LearningPlanSession[];
  error?: string;
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
}

export interface CreateSessionRequest {
  trainer_id: string;
  learners: number[];
  title: string;
  description?: string;
  location: string;
  startDate: string;
  courses: number[];
  hours: number;
  minutes: number;
  type: string;
  repeat_session?: boolean;
  repeat_frequency?: string;
  repeat_every?: string;
  include_weekends?: boolean;
  end_date?: string;
}

export interface UpdateSessionRequest {
  id: number;
  learner_plan_id?: number;
  Attended?: string | null;
  feedback?: string;
  trainer_feedback?: string;
  learner_feedback?: string;
  action_description?: string;
  target_date?: string;
  job_type?: string;
  time_spent?: number;
  status?: string;
}

export interface AddActionRequest {
  learner_plan_id: number;
  action_name: string;
  action_description: string;
  target_date: string;
  job_type: string;
  unit?: string | null;
  who: string;
}

export interface EditActionRequest {
  id: number;
  learner_plan_id?: number;
  action_description?: string;
  target_date?: string;
  job_type?: string;
  time_spent?: number | null;
  trainer_feedback?: string | null;
  learner_feedback?: string | null;
  learner_status?: string;
  status?: string;
}

export interface AddFormToLearnerRequest {
  name: string;
  description: string;
  who: string;
  learner_plan_id: number;
  upload_type: "File Upload" | "Form Selection";
  file_type: string;
  signature_roles: string[];
  files?: File;
  form_id?: number;
}

