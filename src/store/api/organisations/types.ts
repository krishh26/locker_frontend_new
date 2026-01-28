/**
 * Type definitions for Organisation API responses
 * These match the expected backend response structure
 */

export interface AdminUser {
  user_id: number
  first_name: string
  last_name: string
  email: string
  roles: string[]
}

export interface Organisation {
  id: number
  name: string
  status: "active" | "suspended"
  email?: string
  createdAt?: string
  updatedAt?: string
  admins?: AdminUser[]
}

export interface OrganisationListResponse {
  status: boolean
  message?: string
  data: Organisation[]
}

export interface OrganisationResponse {
  status: boolean
  message?: string
  data: Organisation
}

export interface CreateOrganisationRequest {
  name: string
  email?: string
  status: "active" | "suspended"
}

export interface UpdateOrganisationRequest {
  name?: string
  email?: string
  status?: "active" | "suspended"
}

export interface AssignAdminRequest {
  user_id: number
}
