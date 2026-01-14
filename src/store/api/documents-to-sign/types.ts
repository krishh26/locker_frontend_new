/* eslint-disable @typescript-eslint/no-explicit-any */
export type Signature = {
  role: string;
  name?: string;
  is_signed: boolean;
  signed_at?: string;
  is_requested: boolean;
};

export type DocumentToSign = {
  assignment_id: string;
  assignment_name: string;
  course_name: string;
  type?: string;
  assignment_created_at: string;
  signatures?: Signature[];
};

export type PendingSignatureListResponse = {
  status: boolean;
  data?: DocumentToSign[];
  message?: string;
  error?: string;
};

export type SaveSignatureRequest = {
  role: string;
  is_signed: boolean;
};

export type SaveSignatureResponse = {
  status: boolean;
  data?: any;
  message?: string;
  error?: string;
};

