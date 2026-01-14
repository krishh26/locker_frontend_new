export interface Avatar {
  key: string;
  url: string;
}

export interface LineManager {
  user_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  mobile: string;
  roles: string[];
  avatar: Avatar | null;
  password_changed: boolean;
  time_zone: string;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  mobile: string;
  roles: string[];
  avatar: Avatar | null;
  password_changed: boolean;
  time_zone: string;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  line_manager: LineManager | null;
  number_of_active_learners: number;
}

export interface UserListResponse {
  message: string;
  status: boolean;
  data: User[];
  meta_data?: {
    page: number;
    page_size: number;
    pages: number;
    items: number;
  };
}

export interface UserFilters {
  page?: number;
  page_size?: number;
  keyword?: string;
  role?: string;
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  mobile: string;
  time_zone: string;
  roles: string[];
  line_manager_id?: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  user_name?: string;
  email?: string;
  mobile?: string;
  time_zone?: string;
  roles?: string[];
  line_manager_id?: string;
}

export interface UserResponse {
  message: string;
  status: boolean;
  data: User;
}

