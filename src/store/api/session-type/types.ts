export interface SessionType {
  id: number;
  name: string;
  isOffTheJob: boolean;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionTypePayload {
  name: string;
  is_off_the_job: boolean;
  active: boolean;
}

export interface UpdateSessionTypePayload {
  name: string;
  is_off_the_job: boolean;
  active: boolean;
}

export interface ReorderSessionTypePayload {
  id: number;
  direction: "UP" | "DOWN";
}

export interface SessionTypesResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: SessionType[];
}

export interface SessionTypeResponse {
  status: boolean;
  message?: string;
  error?: string;
  data?: SessionType;
}
