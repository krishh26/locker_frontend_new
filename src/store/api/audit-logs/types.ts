/**
 * Type definitions for Audit Log API responses
 * These match the expected backend response structure
 */

export interface AuditLog {
  id: number
  timestamp: string
  organisationId: number
  action: string
  user: string
  details?: string
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
