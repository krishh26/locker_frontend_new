export type InnovationUser = {
  user_id: number;
  user_name: string;
  email: string;
  avatar?: {
    key: string;
    url: string;
  } | null;
};

export type InnovationComment = {
  id: number;
  innovation_id: number;
  type: "Reply" | "Response";
  description: string;
  date: string;
  created_at?: string;
  updated_at?: string;
};

export type Innovation = {
  id: number;
  innovation_propose_by_id: InnovationUser;
  topic: string;
  description: string;
  status: "Open" | "Closed";
  created_at: string;
  updated_at: string;
  comment?: InnovationComment[];
};

export type InnovationsListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Innovation[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type CreateInnovationRequest = {
  innovation_propose_by_id: number;
  topic: string;
  description: string;
  status?: "Open" | "Closed";
};

export type CreateInnovationResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Innovation;
};

export type UpdateInnovationRequest = {
  id: number;
  topic?: string;
  description?: string;
  status?: "Open" | "Closed";
};

export type UpdateInnovationResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Innovation;
};

export type DeleteInnovationRequest = {
  id: number;
};

export type DeleteInnovationResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

export type GetInnovationCommentsRequest = {
  innovationId: number;
};

export type InnovationCommentsResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Innovation; // Returns full Innovation object with comment array
};

export type CreateInnovationCommentRequest = {
  innovation_id: number;
  type: "Reply" | "Response";
  description: string;
  date: string;
};

export type CreateInnovationCommentResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: InnovationComment;
};

