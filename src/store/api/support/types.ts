export type SupportUser = {
  user_id: number;
  user_name: string;
  email: string;
  avatar?: {
    key: string;
    url: string;
  } | null;
};

export type Support = {
  support_id: number;
  request_id: SupportUser;
  title: string;
  description: string;
  status: "Pending" | "InProgress" | "Reject" | "Resolve";
  created_at: string;
  updated_at: string;
};

export type SupportListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Support[];
  meta_data?: {
    page: number;
    items: number;
    page_size: number;
    pages: number;
  };
};

export type CreateSupportRequest = {
  request_id: number;
  title: string;
  description: string;
  status?: "Pending" | "InProgress" | "Reject" | "Resolve";
};

export type CreateSupportResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Support;
};

export type UpdateSupportRequest = {
  support_id: number;
  title?: string;
  description?: string;
  status?: "Pending" | "InProgress" | "Reject" | "Resolve";
};

export type UpdateSupportResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: Support;
};

export type DeleteSupportRequest = {
  support_id: number;
};

export type DeleteSupportResponse = {
  status: boolean;
  message?: string;
  error?: string;
};

