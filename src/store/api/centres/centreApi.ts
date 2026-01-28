import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  CentreListResponse,
  CentreResponse,
  CreateCentreRequest,
  UpdateCentreRequest,
  AssignAdminRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export interface CentreFilters {
  organisationId?: number
  status?: "active" | "suspended"
  page?: number
  limit?: number
}

export const centreApi = createApi({
  reducerPath: "centreApi",
  baseQuery,
  tagTypes: ["Centre"],
  endpoints: (builder) => ({
    getCentres: builder.query<CentreListResponse, CentreFilters | void>({
      query: (filters = {}) => {
        const {
          organisationId,
          status = "",
          page = 1,
          limit = 10,
        } = filters as CentreFilters
        let url = `/centres?page=${page}&limit=${limit}`
        if (organisationId) {
          url += `&organisationId=${organisationId}`
        }
        if (status) {
          url += `&status=${encodeURIComponent(status)}`
        }
        return url
      },
      providesTags: ["Centre"],
      transformResponse: (response: CentreListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    getCentre: builder.query<CentreResponse, number>({
      query: (id) => `/centres/${id}`,
      providesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    createCentre: builder.mutation<CentreResponse, CreateCentreRequest>({
      query: (body) => ({
        url: "/centres",
        method: "POST",
        body: {
          name: body.name,
          organisation_id: body.organisationId,
          status: body.status || "active",
        },
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    updateCentre: builder.mutation<
      CentreResponse,
      { id: number; data: UpdateCentreRequest }
    >({
      query: ({ id, data }) => ({
        url: `/centres/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    activateCentre: builder.mutation<CentreResponse, number>({
      query: (id) => ({
        url: `/centres/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    suspendCentre: builder.mutation<CentreResponse, number>({
      query: (id) => ({
        url: `/centres/${id}/suspend`,
        method: "POST",
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    assignAdminToCentre: builder.mutation<
      CentreResponse,
      { id: number; user_id: number }
    >({
      query: ({ id, user_id }) => ({
        url: `/centres/${id}/assign-admin`,
        method: "POST",
        body: { user_id },
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    removeAdminFromCentre: builder.mutation<
      CentreResponse,
      { id: number; user_id: number }
    >({
      query: ({ id, user_id }) => ({
        url: `/centres/${id}/remove-admin`,
        method: "POST",
        body: { user_id },
      }),
      invalidatesTags: ["Centre"],
      transformResponse: (response: CentreResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetCentresQuery,
  useGetCentreQuery,
  useCreateCentreMutation,
  useUpdateCentreMutation,
  useActivateCentreMutation,
  useSuspendCentreMutation,
  useAssignAdminToCentreMutation,
  useRemoveAdminFromCentreMutation,
} = centreApi
