export interface LineManager {
  user_id: string | number;
  full_name: string;
  email: string;
}

export interface ManagedUser {
  user_id: string | number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
}

export interface CaseloadStatistics {
  total_managed_users: number;
  total_managed_learners: number;
}

export interface CaseloadItem {
  line_manager: LineManager;
  managed_users?: ManagedUser[];
  statistics: CaseloadStatistics;
}

export interface CaseloadQueryParams {
  line_manager_name?: string;
  page?: number;
  limit?: number;
  meta?: boolean;
}

export interface CaseloadMetaData {
  total_line_managers: number;
  page?: number;
  limit?: number;
  total_pages?: number;
}

export interface CaseloadListResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: CaseloadItem[];
  meta_data?: CaseloadMetaData;
}

export interface CaseloadDetailsResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: CaseloadItem;
}
