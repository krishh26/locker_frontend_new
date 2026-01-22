export interface SamplePlanItem {
  plan_id?: number | string;
  planId?: number | string;
  id?: number | string;
  plan_name?: string;
  planName?: string;
  name?: string;
  title?: string;
  sample_plan_name?: string;
  [key: string]: unknown;
}

export interface SamplePlanResponse {
  status?: boolean;
  data?: SamplePlanItem[] | SamplePlanItem | null;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface SamplePlanQueryParams {
  course_id: string | number;
  iqa_id?: string | number;
  eqaId?: string | number;
}

export interface SamplePlanLearnerUnit {
  unit_code?: string | null;
  unit_name?: string | null;
  is_selected?: boolean;
  id?: string | number | null;
  unit_ref?: string | null;
  unitId?: string | number | null;
  unitRef?: string | null;
  type?: string;
  sample_history?: Array<{
    planned_date?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface SamplePlanLearner {
  assessor_name?: string;
  risk_level?: string;
  qa_approved?: boolean;
  learner_name?: string;
  sample_type?: string;
  planned_date?: string | null;
  status?: string;
  units?: SamplePlanLearnerUnit[];
  learner_id?: string | number;
  learnerId?: string | number;
  id?: string | number;
  risk_percentage?: string | number;
  [key: string]: unknown;
}

export interface SamplePlanLearnerPayload {
  plan_id?: string | number;
  course_name?: string;
  learners?: SamplePlanLearner[];
  [key: string]: unknown;
}

export interface SamplePlanLearnersResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: SamplePlanLearnerPayload | SamplePlanLearner[] | null;
  [key: string]: unknown;
}

export interface PlanDetailsResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: {
    qaName?: string;
    assessor_name?: string;
    plannedDate?: string;
    planned_date?: string;
    assessmentMethods?: string[];
    assessment_methods?: Record<string, boolean> | string[];
    assessmentProcesses?: string;
    assessment_processes?: string;
    feedback?: string;
    type?: string;
    completedDate?: string;
    completed_date?: string;
    sampleType?: string;
    sample_type?: string;
    iqaConclusion?: string[];
    iqa_conclusion?: Record<string, boolean> | string[];
    assessorDecisionCorrect?: "Yes" | "No" | "";
    assessor_decision_correct?: boolean | "Yes" | "No" | "";
    sampled_learners?: Array<{
      detail_id?: number | string;
      learner_id?: number | string;
      learner_name?: string;
      sample_type?: string;
      status?: string;
      outcome?: string | null;
      feedback?: string | null;
      planned_date?: string;
      plannedDate?: string;
      completed_date?: string | null;
      completedDate?: string | null;
      assessment_methods?: Record<string, boolean>;
      iqa_conclusion?: Record<string, boolean> | null;
      assessor_decision_correct?: string | null;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface ApplySamplePlanLearnersRequest {
  plan_id: string | number;
  sample_type: string;
  created_by: string | number;
  assessment_methods: Record<string, boolean>;
  learners: Array<{
    learner_id: string | number;
    plannedDate?: string | null;
    units: Array<{
      id: string | number;
      unit_ref: string;
    }>;
  }>;
}

export interface UpdateSamplePlanDetailRequest {
  plan_id: string | number;
  completedDate?: string;
  feedback?: string;
  status?: string;
  assessment_methods?: Record<string, boolean>;
  iqa_conclusion?: Record<string, boolean>;
  assessor_decision_correct?: boolean;
  sample_type?: string;
  plannedDate?: string;
  type?: string;
}

export interface SampleAction {
  id: number;
  action_required: string;
  target_date: string;
  status: "Pending" | "In Progress" | "Completed" | "Closed";
  assessor_feedback: string | null;
  created_at: string;
  updated_at: string;
  action_with: {
    user_id: number;
    user_name: string;
    first_name: string;
    last_name: string;
    email: string;
    [key: string]: unknown;
  };
  created_by: {
    user_id: number;
    user_name: string;
    first_name: string;
    last_name: string;
    email: string;
    [key: string]: unknown;
  };
}

export interface SampleActionsResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: SampleAction[];
}

export interface CreateSampleActionRequest {
  plan_detail_id: string | number;
  action_with_id: string | number;
  action_required: string;
  target_date: string;
  status: "Pending" | "In Progress" | "Completed" | "Closed";
  created_by_id: string | number;
  assessor_feedback?: string;
}

export interface UpdateSampleActionRequest {
  actionId: string | number;
  action_required?: string;
  target_date?: string;
  status?: "Pending" | "In Progress" | "Completed" | "Closed";
  assessor_feedback?: string;
  action_with_id?: string | number;
}

export interface SampleDocument {
  id: number;
  file_name: string;
  file_path?: string;
  file_url?: string;
  uploaded_at: string;
}

export interface SampleDocumentsResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: SampleDocument[];
}

export interface SampleAllocatedForm {
  id: number;
  description?: string | null;
  completed_date?: string | null;
  created_at?: string;
  updated_at?: string;
  form?: {
    id: number;
    form_name: string;
    description?: string;
  };
}

export interface SampleFormsResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: SampleAllocatedForm[];
}

export interface CreateSampleFormRequest {
  plan_detail_id: string | number;
  form_id: string | number;
  allocated_by_id: string | number;
  description?: string;
}

export interface SampleQuestion {
  id: number;
  question_text: string;
  answer: string;
}

export interface SampleQuestionsResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: SampleQuestion[];
}

export interface CreateSampleQuestionsRequest {
  plan_detail_id: string | number;
  answered_by_id: string | number;
  questions: Array<{ question_text: string; answer: string }>;
}

export interface UpdateSampleQuestionRequest {
  id: string | number;
  question_text: string;
  answer: string;
}

export interface UnitMappingItem {
  unit_code: number | string;
  code: string;
  unit_title: string;
  type?: string;
  learnerMapped: boolean;
  trainerMapped: boolean;
  subUnits: Array<{
    id: string | number;
    code?: string;
    title?: string;
    learnerMapped?: boolean;
    trainerMapped?: boolean;
  }>;
}

export interface UnitMappingResponse {
  status: boolean;
  data: UnitMappingItem[];
  message?: string;
  error?: string;
}

export interface EvidenceItem {
  assignment_id: number;
  mapping_id?: number;
  title: string;
  description: string | null;
  file: {
    name: string;
    size: number;
    key: string;
    url: string;
  };
  grade: string | null;
  assessment_method: string[];
  created_at: string;
  unit: {
    unit_ref: string;
    title: string;
  };
  mappedSubUnits: Array<{
    id: number;
    subTitle: string;
    learnerMapped?: boolean;
    trainerMapped?: boolean;
    review?: {
      signed_off: boolean;
      signed_at?: string;
      signed_by?: {
        user_id: number;
        name: string;
      };
    } | null;
  }>;
  reviews: Record<
    string,
    {
      id?: number;
      completed: boolean;
      comment: string;
      signed_off_at: string | null;
      signed_off_by: string | null;
      file?: {
        name: string;
        size: number;
        url: string;
        key: string;
      } | null;
    }
  >;
}

export interface EvidenceListResponse {
  status?: boolean;
  message?: string;
  error?: string;
  data?: EvidenceItem[];
}

export interface AddAssignmentReviewRequest {
  assignment_id: number;
  sampling_plan_detail_id: number;
  role: string;
  comment: string;
  unit_code: string;
  completed?: boolean;
  file?: File;
}

export interface DeleteAssignmentReviewFileRequest {
  assignment_review_id: number;
}

export interface UpdateMappedSubUnitSignOffRequest {
  assignment_id: number;
  unit_code: string | number;
  pc_id: string | number;
  signed_off: boolean;
}

