export type TimeLogEntry = {
  id?: string;
  user_id: string;
  course_id?: {
    course_id: string;
    course_name: string;
  } | string | null;
  activity_date: string;
  activity_type: string;
  unit?: string[] | string;
  trainer_id?: {
    user_id: string;
    user_name: string;
  } | string | null;
  type?: "On the job" | "Off the job" | "Not Applicable" | string;
  spend_time: string; // Format: "HH:MM"
  start_time: string; // Format: "HH:MM"
  end_time: string; // Format: "HH:MM"
  impact_on_learner?: string;
  evidence_link?: string;
  verified?: boolean;
};

export type TimeLogListRequest = {
  page?: number;
  page_size?: number;
  user_id: string;
  course_id?: string | null;
  type?: string; // "On the job" | "Off the job" | "Not Applicable" | "All"
  approved?: string; // "true" | "false" | "All"
};

export type TimeLogListResponse = {
  status: boolean;
  data?: TimeLogEntry[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
  message?: string;
  error?: string;
};

export type TimeLogSliceResponse = {
  status: boolean;
  data?: Array<{
    activity_type: string;
    type: string;
    spend_time: string;
    activity_date: string;
  }>;
  message?: string;
  error?: string;
};

export type TimeLogSpendResponse = {
  status: boolean;
  data?: {
    thisWeek: string; // Format: "HH:MM"
    thisMonth: string; // Format: "HH:MM"
    total: string; // Format: "HH:MM"
  };
  message?: string;
  error?: string;
};

export type TimeLogCreateRequest = {
  user_id: string;
  course_id: string | null;
  activity_date: string;
  activity_type: string;
  unit: string[];
  trainer_id: string | null;
  type: string;
  spend_time: string;
  start_time: string;
  end_time: string;
  impact_on_learner: string;
  evidence_link?: string;
};

export type TimeLogUpdateRequest = {
  id: string;
  user_id?: string;
  course_id?: string | null;
  activity_date?: string;
  activity_type?: string;
  unit?: string[];
  trainer_id?: string | null;
  type?: string;
  spend_time?: string;
  start_time?: string;
  end_time?: string;
  impact_on_learner?: string;
  evidence_link?: string;
  verified?: boolean;
};

export type TimeLogResponse = {
  status: boolean;
  data?: TimeLogEntry;
  message?: string;
  error?: string;
};

export type OtjSummaryRequest = {
  learner_id: string;
  courseId?: string | number | null;
  includeUnverified?: boolean;
};

export type CourseSummary = {
  course_id: number;
  course_name: string;
  course_type?: string;
  status?: string;
  offTheJobHours?: number;
  offTheJobMinutes?: number;
};

export type OtjSummaryResponse = {
  status: boolean;
  data?: {
    durationWeeks?: number;
    otjRequired?: number;
    requiredToDate?: number;
    totalLoggedHours?: number;
    hoursThisWeek?: number;
    hoursThisMonth?: number;
    warnings?: string[];
    courseSummaries?: CourseSummary[];
  };
  message?: string;
  error?: string;
};

export type TimeLogExportRequest = {
  trainer_id?: string;
  course_id?: string;
  date_from?: string; // ISO date string (YYYY-MM-DD)
  date_to?: string; // ISO date string (YYYY-MM-DD)
  type?: string; // "Off the job" | "On the job" | "Not Applicable"
};

export type TimeLogExportData = {
  id: number;
  activity_date: string;
  activity_type: string;
  unit: string;
  type: string;
  spend_time: string;
  start_time: string;
  end_time: string;
  impact_on_learner: string;
  evidence_link: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  trainer_id: {
    user_id: number;
    user_name: string;
    email: string;
  };
  course_id: {
    course_id: number;
    course_name: string;
    course_code: string;
  };
};

export type TimeLogExportResponse = {
  status: boolean;
  data?: TimeLogExportData[];
  message?: string;
  error?: string;
};