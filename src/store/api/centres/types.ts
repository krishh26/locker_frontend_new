/**
 * Type definitions for Centre API responses
 * These match the expected backend response structure
 */

export interface AdminUser {
  user_id: number
  first_name: string
  last_name: string
  email: string
  roles: string[]
}

export interface Centre {
  id: number
  name: string
  organisationId: number
  status: "active" | "suspended"
  address?: string
  admins?: AdminUser[]
}

export interface CentreListResponse {
  status: boolean
  message?: string
  data: Centre[]
}

export interface CentreResponse {
  status: boolean
  message?: string
  data: Centre
}

export interface CreateCentreRequest {
  name: string
  organisationId: number
  status?: "active" | "suspended"
}

export interface UpdateCentreRequest {
  name?: string
  status?: "active" | "suspended"
}

export interface AssignAdminRequest {
  user_id: number
}
