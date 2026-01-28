/**
 * Type definitions for Centre API responses
 * These match the expected backend response structure
 */

export interface Centre {
  id: number
  name: string
  organisationId: number
  status: "active" | "suspended"
  address?: string
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
