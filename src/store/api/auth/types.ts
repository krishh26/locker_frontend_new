export type LoginCredentials = {
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  password: string;
  confirmPassword?: string;
};

export type ApiResponse = {
  status: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
  [key: string]: unknown;
};

export type AuthUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
  assignedOrganisationIds?: number[] | null;
  [key: string]: unknown;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
  passwordChanged?: boolean;
  raw?: unknown;
};

