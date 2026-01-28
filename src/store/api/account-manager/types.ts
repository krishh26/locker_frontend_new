/**
 * Type definitions for Account Manager API responses
 * Based on CSV: Account Manager Module (9 APIs)
 */

export interface AccountManager {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isActive: boolean
  assignedOrganisationIds: number[]
  createdAt?: string
  updatedAt?: string
}

export interface AccountManagerResponse {
  status: boolean
  message?: string
  data: AccountManager
}

export interface AccountManagerListResponse {
  status: boolean
  message?: string
  data: AccountManager[]
}

export interface CreateAccountManagerRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface UpdateAccountManagerRequest {
  email?: string
  firstName?: string
  lastName?: string
}

export interface AssignOrganisationsRequest {
  accountManagerId: number
  organisationIds: number[]
}

export interface RemoveOrganisationAssignmentRequest {
  accountManagerId: number
  organisationId: number
}
