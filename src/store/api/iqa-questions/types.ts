export interface IQAQuestion {
  id: number;
  question: string;
  questionType: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface IQAQuestionResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: IQAQuestion;
}

export interface IQAQuestionListResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: IQAQuestion[];
}

export interface CreateIQAQuestionPayload {
  questionType: string;
  question: string;
}

export interface UpdateIQAQuestionPayload {
  question: string;
  questionType?: string;
  isActive?: boolean;
}
