import type { ApiResponse } from "../auth/types";

// Admin User Types
export interface AdminUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_name: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminListResponse extends ApiResponse {
  data: AdminUser[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface AdminResponse extends ApiResponse {
  data: AdminUser;
}

export interface CreateAdminRequest {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  password: string;
  status?: string;
}

export interface UpdateAdminRequest {
  first_name?: string;
  last_name?: string;
  user_name?: string;
  email?: string;
  status?: string;
}

// System Settings Types
export interface SystemSettings {
  general: {
    site_name: string;
    timezone: string;
    date_format: string;
    time_format: string;
    language: string;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    smtp_encryption: string;
    from_email: string;
    from_name: string;
    enable_notifications: boolean;
  };
  security: {
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_numbers: boolean;
    password_require_special: boolean;
    session_timeout: number;
    require_2fa: boolean;
    max_login_attempts: number;
    lockout_duration: number;
  };
}

export interface SystemSettingsResponse extends ApiResponse {
  data: SystemSettings;
}

export interface UpdateSystemSettingsRequest {
  general?: Partial<SystemSettings["general"]>;
  email?: Partial<SystemSettings["email"]>;
  security?: Partial<SystemSettings["security"]>;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  user_id?: number;
  action: string;
  resource: string;
  resource_id?: number;
  ip_address: string;
  status: "success" | "failure";
  details?: string;
}

export interface AuditLogFilters {
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
  user?: string;
  action?: string;
  status?: string;
}

export interface AuditLogListResponse extends ApiResponse {
  data: AuditLog[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

// Role Permissions Types
export interface RolePermission {
  role: string;
  permission: string;
  allowed: boolean;
}

export interface RolePermissions {
  [role: string]: {
    [permission: string]: boolean;
  };
}

export interface RolePermissionsResponse extends ApiResponse {
  data: RolePermissions;
}

export interface UpdateRolePermissionsRequest {
  permissions: RolePermissions;
}

// Data Export Types
export interface ExportRequest {
  data_types: string[];
  start_date?: string;
  end_date?: string;
  format: "csv" | "json" | "excel";
  include_deleted: boolean;
}

export interface ExportHistory {
  id: number;
  created_at: string;
  data_types: string[];
  format: string;
  status: "completed" | "processing" | "failed";
  file_url?: string;
  file_size?: number;
  created_by: string;
  created_by_id?: number;
}

export interface ExportHistoryResponse extends ApiResponse {
  data: ExportHistory[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface ExportResponse extends ApiResponse {
  data: {
    export_id: number;
    message: string;
  };
}
