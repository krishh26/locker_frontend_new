export interface AutomaticMailControlConfig {
  id?: number;
  organisation_id?: number;
  session_reminder_days_before: 3 | 5 | 7;
  enabled: boolean;
  trainer_session_reminder_days_before?: 3 | 5 | 7 | null;
  trainer_enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutomaticMailControlConfigResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: AutomaticMailControlConfig;
}

export interface SaveAutomaticMailControlConfigRequest {
  session_reminder_days_before: 3 | 5 | 7;
  enabled: boolean;
  trainer_session_reminder_days_before?: 3 | 5 | 7 | null;
  trainer_enabled?: boolean;
}

