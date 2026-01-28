/**
 * Type definitions for Organisation API responses
 * These match the expected backend response structure
 */

export interface Organisation {
  id: number
  name: string
  status: "active" | "suspended"
  email?: string
  createdAt?: string
  updatedAt?: string
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
