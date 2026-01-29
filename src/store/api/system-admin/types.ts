/**
 * Type definitions for System Admin API responses
 * Based on CSV: System Admin Module (9 APIs)
 */

export interface SystemAdmin {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isActive: boolean
  isProtected: boolean
  createdAt?: string
  updatedAt?: string
}

export interface SystemAdminResponse {
  status: boolean
  message?: string
  data: SystemAdmin
}

export interface SystemAdminListResponse {
  status: boolean
  message?: string
  data: SystemAdmin[]
}

export interface CreateSystemAdminRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface UpdateSystemAdminRequest {
  email?: string
  firstName?: string
  lastName?: string
}

export interface AssignMasterAdminRoleRequest {
  userId: number
}

export interface RemoveMasterAdminRoleRequest {
  adminId: number
}
