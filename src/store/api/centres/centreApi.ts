import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  CentreListResponse,
  CentreResponse,
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
  }),
})

export const {
  useGetCentresQuery,
  useGetCentreQuery,
} = centreApi
