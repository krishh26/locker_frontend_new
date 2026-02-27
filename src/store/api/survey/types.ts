// Survey Management API Types

export type SurveyStatus = 'Draft' | 'Published' | 'Archived';

export type BackgroundType = 'gradient' | 'image';

export interface Survey {
  id: string;
  name: string;
  description?: string;
  status: SurveyStatus;
  background?: {
    type: BackgroundType;
    value: string; // CSS gradient string or image URL
  };
  expirationDate?: string; // ISO 8601 format (UTC)
  userId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  totalQuestions?: number; // Optional: provided by API in list responses
  totalResponses?: number; // Optional: provided by API in list responses
}

export interface SurveyBackground {
  type: BackgroundType;
  value: string;
}

// Request Types
export interface CreateSurveyRequest {
  name: string;
  description?: string;
  status?: SurveyStatus;
  background?: SurveyBackground;
  expirationDate?: string; // ISO 8601 format (UTC)
  organizationId?: number | string;
}

export interface UpdateSurveyRequest {
  name?: string;
  description?: string;
  status?: SurveyStatus;
  background?: SurveyBackground;
  expirationDate?: string; // ISO 8601 format (UTC)
  organizationId?: number | string;
}

export interface GetSurveysQueryParams {
  status?: SurveyStatus;
  userId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// Response Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetSurveysResponse {
  status: boolean;
  data: {
    surveys: Survey[];
    pagination: PaginationMeta;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface GetSurveyResponse {
    status: boolean;
  data: {
    survey: Survey;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface CreateSurveyResponse {
  status: boolean;
  data: {
    survey: Survey;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface UpdateSurveyResponse {
  status: boolean;
  data: {
    survey: Survey;
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface DeleteSurveyResponse {
  status: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Question Management API Types

export type QuestionType = 'short-text' | 'long-text' | 'multiple-choice' | 'checkbox' | 'rating' | 'date' | 'likert';

export interface Question {
  id: string;
  surveyId: string;
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[] | null;
  statements?: string[] | null; // For Likert scale questions (rows)
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// Question Request Types
export interface CreateQuestionRequest {
  title: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[] | null;
  statements?: string[] | null; // For Likert scale questions (rows)
  order?: number;
}

export interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  type?: QuestionType;
  required?: boolean;
  options?: string[] | null;
  statements?: string[] | null; // For Likert scale questions (rows)
  order?: number;
}

export interface ReorderQuestionsRequest {
  questionIds: string[];
}

// Question Response Types
export interface GetQuestionsResponse {
  status: boolean;
  data: {
    questions: Question[];
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface GetQuestionResponse {
  status: boolean;
  data: {
    question: Question;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface CreateQuestionResponse {
  status: boolean;
  data: {
    question: Question;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface UpdateQuestionResponse {
  status: boolean;
  data: {
    question: Question;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface DeleteQuestionResponse {
  status: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface ReorderQuestionsResponse {
  status: boolean;
  data: {
    questions: Array<{
      id: string;
      order: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Response Management API Types

export interface Response {
  id: string;
  surveyId: string;
  userId?: string;
  email?: string;
  answers: Record<string, string | string[] | Record<string, string> | null>; // questionId → answer value (Likert uses Record<string, string>)
  submittedAt: string;
}

// Response Request Types
export interface GetResponsesQueryParams {
  page?: number;
  limit?: number;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
}

export interface SubmitResponseRequest {
  userId?: string;
  email?: string;
  answers: Record<string, string | string[] | Record<string, string> | null>; // questionId → answer value (Likert uses Record<string, string>)
}

// Response Response Types
export interface GetResponsesResponse {
  success: boolean;
  data: {
    responses: Response[];
    pagination: PaginationMeta;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface GetResponseResponse {
  status: boolean;
  data: {
    response: Response;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface SubmitResponseResponse {
  success: boolean;
  data: {
    response: Response;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface DeleteResponseResponse {
  status: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Template Application API Types
export interface ApplyTemplateRequest {
  background?: SurveyBackground;
  questions: CreateQuestionRequest[];
}

export interface ApplyTemplateResponse {
  status: boolean;
  data: {
    survey: Survey;
    questions: Question[];
  };
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Public Survey API Types
export interface GetPublicSurveyResponse {
  success: boolean;
  data: {
    survey: Survey;
    questions: Question[];
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// Survey Allocation API Types
export type AllocationRole = 'Trainer' | 'IQA' | 'Learner' | 'EQA';

export interface AllocateSurveyRequest {
  survey_id: string;
  allocations: Array<{
    user_id: number;
    role: AllocationRole;
    user_type: 'user' | 'learner';
  }>;
}

export interface AllocateSurveyResponse {
  status: boolean;
  message?: string;
  data?: {
    allocated_count: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}
