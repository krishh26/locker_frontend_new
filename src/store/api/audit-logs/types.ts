/**
 * Type definitions for Audit Log API responses
 * These match the expected backend response structure
 */

export interface AuditLogDetails {
  action?: string
  [key: string]: unknown
}

export interface AuditLog {
  id: number
  userId: number
  userName: string
  userEmail: string
  actionType: string
  entityType: string
  entityId: number
  organisationId: number | null
  organisationName: string | null
  centreId: number | null
  details?: AuditLogDetails | string
  ipAddress?: string
  createdAt: string
}

export interface AuditLogListResponse {
  status: boolean
  message?: string
  data: AuditLog[]
}

export interface AuditLogResponse {
  status: boolean
  message?: string
  data: AuditLog
}
