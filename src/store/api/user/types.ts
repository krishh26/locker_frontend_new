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
  number_of_active_learners?: number;
  assigned_employers?: Array<{
    employer_id: number;
    employer_name: string;
  }>;
  userEmployers?: Array<{
    id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    employer: {
      employer_id: number;
      employer_name: string;
      [key: string]: unknown;
    };
  }>;
  assigned_organisations?: Array<{
    id: number;
    name: string;
  }>;
  assigned_centres?: Array<{
    id: number;
    name: string;
  }>;
  /** API may send assigned_centers (American spelling) */
  assigned_centers?: Array<{
    id: number;
    name: string;
  }>;
  /** Used to derive organisation_id for centre admin when assigned_organisations is empty */
  userCentres?: Array<{
    id: number;
    user_id: number;
    centre_id: number;
    centre?: {
      id: number;
      name: string;
      organisation_id: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
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

export interface AssignedLearner {
  learner_id: number;
  first_name: string;
  last_name: string;
  user_name: string;
  email: string;
  course_id: number;
  course_name: string;
  user_course_id: number;
  course_status: string;
  start_date: string;
  end_date: string;
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
  assigned_learner_ids?: number[];
  organisation_ids?: number[];
  centre_id?: number;
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
  assigned_learner_ids?: number[];
  organisation_ids?: number[];
  centre_id?: number;
}

export interface UserResponse {
  message: string;
  status: boolean;
  data: User;
}

export interface ChangeUserRoleRequest {
  role: string;
}

export interface ChangeUserRoleResponse {
  message: string;
  status: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

