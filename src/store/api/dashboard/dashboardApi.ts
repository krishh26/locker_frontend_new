import { createApi } from "@reduxjs/toolkit/query/react"
import type { DashboardResponse, CardDataResponse, CardApiType } from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard", "CardData"],
  endpoints: (builder) => ({
    getDashboardCounts: builder.query<DashboardResponse, void>({
      query: () => `/learner/list-with-count`,
      providesTags: ["Dashboard"],
      transformResponse: (response: DashboardResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    getCardData: builder.query<CardDataResponse, CardApiType | string>({
      query: (type) => `/learner/list-with-count?type=${type}`,
      providesTags: (result, error, type) => [{ type: "CardData", id: type }],
      transformResponse: (response: CardDataResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetDashboardCountsQuery,
  useLazyGetDashboardCountsQuery,
  useLazyGetCardDataQuery,
} = dashboardApi

