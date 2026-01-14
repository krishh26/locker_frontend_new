export type Resource = {
  resource_id?: string | number;
  id?: string | number;
  name: string;
  description?: string;
  glh?: string | number;
  hours?: string | number;
  minute?: string | number;
  job_type?: "On" | "Off" | "Not Applicable" | string;
  resource_type?: string;
  course_id?: string;
  file?: string;
  file_url?: string;
  size?: string | number;
  url?: {
    key: string;
    url: string;
  };
  created_at?: string;
  updated_at?: string;
};

export type ResourceListRequest = {
  page?: number;
  page_size?: number;
  search?: string;
  job_type?: "On" | "Off" | "";
};

export type ResourceListResponse = {
  status: boolean;
  data?: Resource[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
  message?: string;
  error?: string;
};

export type ResourceResponse = {
  status: boolean;
  data?: Resource;
  message?: string;
  error?: string;
};

export type ResourceCreateRequest = FormData | {
  course_id: string;
  name: string;
  description?: string;
  glh?: number;
  job_type: "On" | "Off";
  resource_type: string;
  file?: File;
  hours?: number;
  minute?: number;
};

export type ResourceUpdateRequest = {
  name?: string;
  description?: string;
  glh?: number;
  job_type?: "On" | "Off";
  resource_type?: string;
  course_id?: string;
};

// Course Resources Types
export type CourseResource = {
  id: string | number;
  resource_id: string | number;
  name: string;
  description?: string;
  hours?: string | number;
  minute?: string | number;
  job_type?: "On" | "Off" | "Not Applicable" | string;
  isAccessed?: boolean;
  url?: {
    url: string;
    key?: string;
  };
};

export type CourseResourceListRequest = {
  course_id: number | string;
  user_id: number | string;
  search?: string;
  job_type?: "On" | "Off" | "";
};

export type CourseResourceListResponse = {
  status: boolean;
  data?: CourseResource[];
  message?: string;
  error?: string;
};

export type ResourceAccessRequest = {
  resource_id: number | string;
  user_id: number | string;
};

export type ResourceAccessResponse = {
  status: boolean;
  message?: string;
  error?: string;
};