import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  AuditLogListResponse,
  AuditLogResponse,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export interface AuditLogFilters {
  organisationId?: number
  action?: string
  user?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const auditLogApi = createApi({
  reducerPath: "auditLogApi",
  baseQuery,
  tagTypes: ["AuditLog"],
  endpoints: (builder) => ({
    getAuditLogs: builder.query<AuditLogListResponse, AuditLogFilters | void>({
      query: (filters = {}) => {
        const {
          organisationId,
          action = "",
          user = "",
          dateFrom = "",
          dateTo = "",
          page = 1,
          limit = 10,
        } = filters as AuditLogFilters
        let url = `/audit-logs?page=${page}&limit=${limit}`
        if (organisationId) {
          url += `&organisationId=${organisationId}`
        }
        if (action) {
          url += `&action=${encodeURIComponent(action)}`
        }
        if (user) {
          url += `&user=${encodeURIComponent(user)}`
        }
        if (dateFrom) {
          url += `&dateFrom=${encodeURIComponent(dateFrom)}`
        }
        if (dateTo) {
          url += `&dateTo=${encodeURIComponent(dateTo)}`
        }
        return url
      },
      providesTags: ["AuditLog"],
      transformResponse: (response: AuditLogListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    getAuditLog: builder.query<AuditLogResponse, number>({
      query: (id) => `/audit-logs/${id}`,
      providesTags: ["AuditLog"],
      transformResponse: (response: AuditLogResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetAuditLogsQuery,
  useGetAuditLogQuery,
} = auditLogApi
