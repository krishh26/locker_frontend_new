import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  AccessScopeResponse,
  ValidateAccessRequest,
  ValidateAccessResponse,
  SwitchContextRequest,
  SwitchContextResponse,
  ResolveLoginRoleResponse,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const accessControlApi = createApi({
  reducerPath: "accessControlApi",
  baseQuery,
  tagTypes: ["AccessControl"],
  endpoints: (builder) => ({
    // Get User Access Scope - "What user can see"
    getUserAccessScope: builder.query<AccessScopeResponse, void>({
      query: () => "/access-control/user-scope",
      providesTags: ["AccessControl"],
      transformResponse: (response: AccessScopeResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Validate Access to Organisation - "Access check"
    validateAccessToOrganisation: builder.mutation<
      ValidateAccessResponse,
      { organisationId: number }
    >({
      query: ({ organisationId }) => ({
        url: `/access-control/validate/organisation/${organisationId}`,
        method: "POST",
      }),
      transformResponse: (response: ValidateAccessResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Validate Access to Centre - "Access check"
    validateAccessToCentre: builder.mutation<
      ValidateAccessResponse,
      { centreId: number }
    >({
      query: ({ centreId }) => ({
        url: `/access-control/validate/centre/${centreId}`,
        method: "POST",
      }),
      transformResponse: (response: ValidateAccessResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Switch User Context - "Change active scope"
    switchUserContext: builder.mutation<
      SwitchContextResponse,
      SwitchContextRequest
    >({
      query: (body) => ({
        url: "/access-control/switch-context",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccessControl"],
      transformResponse: (response: SwitchContextResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Resolve Login Role - "Role priority logic"
    resolveLoginRole: builder.query<ResolveLoginRoleResponse, void>({
      query: () => "/access-control/resolve-role",
      providesTags: ["AccessControl"],
      transformResponse: (response: ResolveLoginRoleResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetUserAccessScopeQuery,
  useValidateAccessToOrganisationMutation,
  useValidateAccessToCentreMutation,
  useSwitchUserContextMutation,
  useResolveLoginRoleQuery,
} = accessControlApi
