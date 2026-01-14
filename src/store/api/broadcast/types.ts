export interface BroadcastUser {
  user_id: number;
  user_name: string;
  email: string;
}

export interface Broadcast {
  id: number;
  title: string;
  description: string;
  user_id: BroadcastUser;
  created_at: string;
  updated_at?: string;
}

export interface BroadcastListResponse {
  message: string;
  status: boolean;
  data: Broadcast[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
}

export interface BroadcastFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
}

export interface CreateBroadcastRequest {
  title: string;
  description: string;
}

export interface UpdateBroadcastRequest {
  title?: string;
  description?: string;
}

export interface BroadcastResponse {
  message: string;
  status: boolean;
  data: Broadcast;
}

export interface BroadcastMessageRequest {
  title: string;
  description: string;
  assign?: "All" | "All Learner" | "All EQA" | "All Trainer" | "All Employer" | "All IQA" | "All LIQA";
  user_ids?: number[];
  course_ids?: number[];
}

export interface BroadcastMessageResponse {
  message: string;
  status: boolean;
}

