import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  AccountManagerResponse,
  AccountManagerListResponse,
  CreateAccountManagerRequest,
  UpdateAccountManagerRequest,
  AssignOrganisationsRequest,
  RemoveOrganisationAssignmentRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const accountManagerApi = createApi({
  reducerPath: "accountManagerApi",
  baseQuery,
  tagTypes: ["AccountManager"],
  endpoints: (builder) => ({
    // Create Account Manager - "Create account manager user"
    createAccountManager: builder.mutation<
      AccountManagerResponse,
      CreateAccountManagerRequest
    >({
      query: (body) => ({
        url: "/account-manager",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // List Account Managers - "View all account managers"
    getAccountManagers: builder.query<AccountManagerListResponse, void>({
      query: () => "/account-manager",
      providesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Account Manager Details - "View profile & assignments"
    getAccountManager: builder.query<AccountManagerResponse, number>({
      query: (id) => `/account-manager/${id}`,
      providesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Update Account Manager - "Update details"
    updateAccountManager: builder.mutation<
      AccountManagerResponse,
      { id: number; data: UpdateAccountManagerRequest }
    >({
      query: ({ id, data }) => ({
        url: `/account-manager/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Activate Account Manager - "Enable access"
    activateAccountManager: builder.mutation<AccountManagerResponse, number>({
      query: (id) => ({
        url: `/account-manager/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Deactivate Account Manager - "Disable access"
    deactivateAccountManager: builder.mutation<AccountManagerResponse, number>({
      query: (id) => ({
        url: `/account-manager/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Delete Account Manager
    deleteAccountManager: builder.mutation<
      { status: boolean; message?: string },
      number
    >({
      query: (id) => ({
        url: `/account-manager/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: { status: boolean; message?: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Assign Organisations - "Assign companies to manager"
    assignOrganisations: builder.mutation<
      AccountManagerResponse,
      AssignOrganisationsRequest
    >({
      query: (body) => ({
        url: "/account-manager/assign-organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Remove Organisation Assignment - "Unassign company"
    removeOrganisationAssignment: builder.mutation<
      AccountManagerResponse,
      RemoveOrganisationAssignmentRequest
    >({
      query: (body) => ({
        url: "/account-manager/remove-organisation",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccountManager"],
      transformResponse: (response: AccountManagerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // List Assigned Organisations - "Companies visible to manager"
    getAssignedOrganisations: builder.query<
      { status: boolean; message?: string; data: number[] },
      number
    >({
      query: (accountManagerId) =>
        `/account-manager/${accountManagerId}/organisations`,
      providesTags: ["AccountManager"],
      transformResponse: (response: {
        status: boolean
        message?: string
        data: number[]
      }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useCreateAccountManagerMutation,
  useGetAccountManagersQuery,
  useGetAccountManagerQuery,
  useUpdateAccountManagerMutation,
  useActivateAccountManagerMutation,
  useDeactivateAccountManagerMutation,
  useDeleteAccountManagerMutation,
  useAssignOrganisationsMutation,
  useRemoveOrganisationAssignmentMutation,
  useGetAssignedOrganisationsQuery,
} = accountManagerApi
