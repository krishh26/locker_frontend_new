import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  Centre,
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
      transformResponse: (response: CentreListResponse & { data?: (Centre & { organisation_id?: number })[] }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        const rawList = response.data ?? []
        const data: Centre[] = rawList.map((raw: Centre & { organisation_id?: number }) => ({
          ...raw,
          organisationId: raw.organisationId ?? raw.organisation_id ?? 0,
        }))
        return { ...response, data }
      },
    }),
    getCentre: builder.query<CentreResponse, number>({
      query: (id) => `/centres/${id}`,
      providesTags: ["Centre"],
      transformResponse: (response: CentreResponse & { data?: Centre & { organisation_id?: number } }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        const raw = response.data as (Centre & { organisation_id?: number }) | undefined
        if (!raw) return response
        const data: Centre = {
          ...raw,
          organisationId: raw.organisationId ?? raw.organisation_id ?? 0,
        }
        return { ...response, data }
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
    setCentreAdmins: builder.mutation<
      CentreResponse,
      { id: number; user_ids: number[] }
    >({
      query: ({ id, user_ids }) => ({
        url: `/centres/${id}/admins`,
        method: "PUT",
        body: { user_ids },
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
  useSetCentreAdminsMutation,
} = centreApi
