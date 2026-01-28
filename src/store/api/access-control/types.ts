/**
 * Type definitions for Access Control API responses
 * Based on CSV: Access Control Module (5 APIs)
 */

export interface UserAccessScope {
  role: string
  assignedOrganisationIds: number[] | null
  accessibleOrganisationIds: number[]
  accessibleCentreIds: number[]
  permissions: string[]
}

export interface AccessScopeResponse {
  status: boolean
  message?: string
  data: UserAccessScope
}

export interface ValidateAccessRequest {
  organisationId?: number
  centreId?: number
}

export interface ValidateAccessResponse {
  status: boolean
  message?: string
  data: {
    hasAccess: boolean
    reason?: string
  }
}

export interface SwitchContextRequest {
  organisationId?: number
  centreId?: number
}

export interface SwitchContextResponse {
  status: boolean
  message?: string
  data: {
    activeScope: {
      organisationId?: number
      centreId?: number
    }
  }
}

export interface ResolveLoginRoleResponse {
  status: boolean
  message?: string
  data: {
    role: string
    priority: number
    assignedOrganisationIds: number[] | null
  }
}
