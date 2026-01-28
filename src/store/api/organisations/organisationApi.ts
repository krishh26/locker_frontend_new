import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  OrganisationResponse,
  OrganisationListResponse,
  CreateOrganisationRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export interface OrganisationFilters {
  status?: "active" | "suspended"
  search?: string
  page?: number
  limit?: number
}

export const organisationApi = createApi({
  reducerPath: "organisationApi",
  baseQuery,
  tagTypes: ["Organisation"],
  endpoints: (builder) => ({
    getOrganisations: builder.query<OrganisationListResponse, OrganisationFilters | void>({
      query: (filters = {}) => {
        const {
          status = "",
          search = "",
          page = 1,
          limit = 10,
        } = filters as OrganisationFilters
        let url = `/organisations?page=${page}&limit=${limit}`
        if (status) {
          url += `&status=${encodeURIComponent(status)}`
        }
        if (search) {
          url += `&search=${encodeURIComponent(search)}`
        }
        return url
      },
      providesTags: ["Organisation"],
      transformResponse: (response: OrganisationListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    getOrganisation: builder.query<OrganisationResponse, number>({
      query: (id) => `/organisations/${id}`,
      providesTags: ["Organisation"],
      transformResponse: (response: OrganisationResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    createOrganisation: builder.mutation<OrganisationResponse, CreateOrganisationRequest>({
      query: (body) => ({
        url: "/organisations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Organisation"],
      transformResponse: (response: OrganisationResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetOrganisationsQuery,
  useGetOrganisationQuery,
  useCreateOrganisationMutation,
} = organisationApi
