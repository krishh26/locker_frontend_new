import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  SystemAdminResponse,
  SystemAdminListResponse,
  CreateSystemAdminRequest,
  UpdateSystemAdminRequest,
  AssignMasterAdminRoleRequest,
  RemoveMasterAdminRoleRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const systemAdminApi = createApi({
  reducerPath: "systemAdminApi",
  baseQuery,
  tagTypes: ["SystemAdmin"],
  endpoints: (builder) => ({
    // Create System Admin - "Create a new master admin user"
    createSystemAdmin: builder.mutation<
      SystemAdminResponse,
      CreateSystemAdminRequest
    >({
      query: (body) => ({
        url: "/system-admin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // List System Admins - "Get all master admins"
    getSystemAdmins: builder.query<SystemAdminListResponse, void>({
      query: () => "/system-admin",
      providesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get System Admin Details - "View specific master admin"
    getSystemAdmin: builder.query<SystemAdminResponse, number>({
      query: (id) => `/system-admin/${id}`,
      providesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Update System Admin - "Update master admin profile"
    updateSystemAdmin: builder.mutation<
      SystemAdminResponse,
      { id: number; data: UpdateSystemAdminRequest }
    >({
      query: ({ id, data }) => ({
        url: `/system-admin/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Activate System Admin - "Enable login access"
    activateSystemAdmin: builder.mutation<SystemAdminResponse, number>({
      query: (id) => ({
        url: `/system-admin/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Deactivate System Admin - "Disable login access"
    deactivateSystemAdmin: builder.mutation<SystemAdminResponse, number>({
      query: (id) => ({
        url: `/system-admin/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Assign Master Admin Role - "Promote user to master admin"
    assignMasterAdminRole: builder.mutation<
      SystemAdminResponse,
      AssignMasterAdminRoleRequest
    >({
      query: (body) => ({
        url: "/system-admin/assign-role",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Remove Master Admin Role - "Demote master admin"
    removeMasterAdminRole: builder.mutation<
      { status: boolean; message?: string },
      RemoveMasterAdminRoleRequest
    >({
      query: (body) => ({
        url: "/system-admin/remove-role",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: { status: boolean; message?: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Protect Master Admin - "Prevent delete of primary admins"
    protectMasterAdmin: builder.mutation<SystemAdminResponse, number>({
      query: (id) => ({
        url: `/system-admin/${id}/protect`,
        method: "POST",
      }),
      invalidatesTags: ["SystemAdmin"],
      transformResponse: (response: SystemAdminResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useCreateSystemAdminMutation,
  useGetSystemAdminsQuery,
  useGetSystemAdminQuery,
  useUpdateSystemAdminMutation,
  useActivateSystemAdminMutation,
  useDeactivateSystemAdminMutation,
  useAssignMasterAdminRoleMutation,
  useRemoveMasterAdminRoleMutation,
  useProtectMasterAdminMutation,
} = systemAdminApi
