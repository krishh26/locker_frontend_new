import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AdminListResponse,
  AdminResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  SystemSettingsResponse,
  UpdateSystemSettingsRequest,
  AuditLogListResponse,
  AuditLogFilters,
  RolePermissionsResponse,
  UpdateRolePermissionsRequest,
  ExportRequest,
  ExportResponse,
  ExportHistoryResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const masterAdminApi = createApi({
  reducerPath: "masterAdminApi",
  baseQuery,
  tagTypes: ["Admin", "SystemSettings", "AuditLog", "RolePermissions", "Export"],
  endpoints: (builder) => ({
    // Admin Management
    getAdmins: builder.query<AdminListResponse, { page?: number; page_size?: number; keyword?: string }>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "" } = filters;
        let url = `/master-admin/admins?page=${page}&limit=${page_size}`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        return url;
      },
      providesTags: ["Admin"],
      transformResponse: (response: AdminListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createAdmin: builder.mutation<AdminResponse, CreateAdminRequest>({
      query: (body) => ({
        url: "/master-admin/admins",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Admin"],
      transformResponse: (response: AdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateAdmin: builder.mutation<AdminResponse, { id: number; data: UpdateAdminRequest }>({
      query: ({ id, data }) => ({
        url: `/master-admin/admins/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Admin"],
      transformResponse: (response: AdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteAdmin: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/master-admin/admins/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // System Settings
    getSystemSettings: builder.query<SystemSettingsResponse, void>({
      query: () => "/master-admin/system-settings",
      providesTags: ["SystemSettings"],
      transformResponse: (response: SystemSettingsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSystemSettings: builder.mutation<SystemSettingsResponse, UpdateSystemSettingsRequest>({
      query: (body) => ({
        url: "/master-admin/system-settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["SystemSettings"],
      transformResponse: (response: SystemSettingsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Audit Logs
    getAuditLogs: builder.query<AuditLogListResponse, AuditLogFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, start_date, end_date, user, action, status } = filters;
        let url = `/master-admin/audit-logs?page=${page}&limit=${page_size}`;
        if (start_date) url += `&start_date=${encodeURIComponent(start_date)}`;
        if (end_date) url += `&end_date=${encodeURIComponent(end_date)}`;
        if (user) url += `&user=${encodeURIComponent(user)}`;
        if (action) url += `&action=${encodeURIComponent(action)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;
        return url;
      },
      providesTags: ["AuditLog"],
      transformResponse: (response: AuditLogListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Role Permissions
    getRolePermissions: builder.query<RolePermissionsResponse, void>({
      query: () => "/master-admin/role-permissions",
      providesTags: ["RolePermissions"],
      transformResponse: (response: RolePermissionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateRolePermissions: builder.mutation<RolePermissionsResponse, UpdateRolePermissionsRequest>({
      query: (body) => ({
        url: "/master-admin/role-permissions",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["RolePermissions"],
      transformResponse: (response: RolePermissionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // Data Export
    exportData: builder.mutation<ExportResponse, ExportRequest>({
      query: (body) => ({
        url: "/master-admin/data-export",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Export"],
      transformResponse: (response: ExportResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getExportHistory: builder.query<ExportHistoryResponse, { page?: number; page_size?: number }>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10 } = filters;
        return `/master-admin/data-export/history?page=${page}&limit=${page_size}`;
      },
      providesTags: ["Export"],
      transformResponse: (response: ExportHistoryResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetAuditLogsQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useExportDataMutation,
  useGetExportHistoryQuery,
} = masterAdminApi;
