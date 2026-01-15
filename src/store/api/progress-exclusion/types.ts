export interface ProgressExclusionData {
  course_id: number;
  excluded_statuses: string[];
}

export interface ProgressExclusionResponse {
  status: boolean;
  data?: ProgressExclusionData;
  message?: string;
  error?: string;
}

export interface UpdateProgressExclusionRequest {
  course_id: number;
  excluded_statuses: string[];
}

