export interface Signature {
  name?: string;
  requestedAt?: string;
  signedAt?: string;
  is_requested?: boolean;
  isSigned?: boolean;
}

export interface Signatures {
  Trainer?: Signature;
  Learner?: Signature;
  Employer?: Signature;
  IQA?: Signature;
}

export interface AwaitingSignatureEntry {
  learner?: {
    name?: string;
  };
  course?: {
    name?: string;
    code?: string;
  };
  signatures?: Signatures;
  file_type?: string;
  file_name?: string;
  file_description?: string;
  uploaded_at?: string;
}

export interface AwaitingSignatureListRequest {
  page?: number;
  limit?: number;
  assessor_id?: string;
  course_id?: string;
  learner_name?: string;
  meta?: boolean;
}

export interface AwaitingSignatureListResponse {
  status: boolean;
  data?: AwaitingSignatureEntry[];
  page?: number;
  pages?: number;
  total?: number;
  message?: string;
  error?: string;
}

