/* eslint-disable @typescript-eslint/no-explicit-any */
export type EvidenceFile = {
  name: string;
  key: string;
  url: string;
};

export type EvidenceCourse = {
  course_id: number;
  course_name: string;
  course_code: string;
};

export type EvidenceMapping = {
  mapping_id: number;
  unit_code: string;
  sub_unit_id: number | null;
  course_id?: number; // Direct course_id from API response
  learnerMap?: boolean; // camelCase version
  learner_map?: boolean; // snake_case version from API
  trainerMap?: boolean; // camelCase version
  trainer_map?: boolean; // snake_case version from API
  signedOff?: boolean;
  signed_off?: boolean; // snake_case version from API
  comment?: string | null;
  comment_updated_at?: string | null;
  course?: {
    course_id: number;
    course_name: string;
    course_code: string;
    course_core_type?: string;
    units?: any[];
  };
};

export type EvidenceEntry = {
  assignment_id: number;
  file: EvidenceFile | null;
  declaration: string | null;
  title: string | null;
  description: string | null;
  trainer_feedback: string | null;
  external_feedback: string | null;
  learner_comments: string | null;
  points_for_improvement: string | null;
  assessment_method: string | null;
  session: string | null;
  grade: string | null;
  mappings?: EvidenceMapping[];
  status: string;
  evidence_time_log: boolean;
  created_at: string;
  updated_at: string;
  course_id: EvidenceCourse;
};

export type EvidenceListParams = {
  user_id?: string | number;
  page?: number;
  limit?: number;
  meta?: boolean;
  search?: string;
  course_id?: number | string;
};

export type EvidenceListResponse = {
  status: boolean;
  data?: EvidenceEntry[];
  meta_data?: {
    items: number;
    pages: number;
    current_page: number;
    limit: number;
  };
  message?: string;
  error?: string;
};

export type EvidenceDetailResponse = {
  status: boolean;
  data?: EvidenceEntry;
  message?: string;
  error?: string;
};

export type EvidenceCreateRequest = {
  title?: string;
  description?: string;
  course_id?: number;
  file?: File;
  [key: string]: any;
};

export type EvidenceUpdateRequest = {
  title?: string;
  description?: string;
  declaration?: string;
  trainer_feedback?: string;
  external_feedback?: string;
  learner_comments?: string;
  points_for_improvement?: string;
  assessment_method?: string[];
  session?: string;
  grade?: string;
  [key: string]: any;
};

export type EvidenceReuploadRequest = {
  file: File;
};

