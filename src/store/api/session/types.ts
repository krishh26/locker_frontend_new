export interface Trainer {
  user_id: number;
  user_name: string;
  email: string;
}

export interface Learner {
  learner_id: number;
  user_name: string;
  email: string;
}

export interface Session {
  session_id: number;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  Duration?: string;
  type?: string;
  Attended?: string;
  trainer_id: Trainer;
  learners: Learner[];
}

export interface SessionMetaData {
  page: number;
  items: number;
  page_size: number;
  pages: number;
}

export interface SessionListResponse {
  message: string;
  status: boolean;
  data: Session[];
  meta_data: SessionMetaData;
}

export interface SessionFilters {
  trainer_id?: string;
  Attended?: string;
  sortBy?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface SessionCreateRequest {
  trainer_id: string | number;
  learners: (string | number)[];
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  Duration?: string;
  type?: string;
}

export interface SessionUpdateRequest {
  Attended?: string;
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  Duration?: string;
  type?: string;
  trainer_id?: string | number;
  learners?: (string | number)[];
}

export interface SessionResponse {
  message: string;
  status: boolean;
  data?: Session;
  error?: string;
}
