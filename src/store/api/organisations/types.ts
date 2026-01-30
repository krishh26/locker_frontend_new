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

/** Minimal centre shape when embedded in organisation response (avoids circular import from centres) */
export interface OrganisationCentre {
  id: number
  name: string
  organisation_id?: number
  organisationId?: number
  status: "active" | "suspended"
  admins?: AdminUser[]
}

export interface Organisation {
  id: number
  name: string
  status: "active" | "suspended"
  email?: string
  createdAt?: string
  updatedAt?: string
  admins?: AdminUser[]
  centres?: OrganisationCentre[]
}

export interface OrganisationListMetaData {
  page: number
  page_size: number
  pages: number
  items: number
}

export interface OrganisationListResponse {
  status: boolean
  message?: string
  data: Organisation[]
  meta_data?: OrganisationListMetaData
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
