import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  DashboardResponse,
  CardDataResponse,
  CardApiType,
  SystemSummaryResponse,
  OrganisationMetricsResponse,
  UserMetricsResponse,
  AccountManagerMetricsResponse,
  ActivityMetricsResponse,
  StatusOverviewResponse,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery,
  tagTypes: ["Dashboard", "CardData"],
  endpoints: (builder) => ({
    // Existing endpoints
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
    // New endpoints based on CSV: Dashboard Module (6 APIs)
    // Get System Summary - "Overall system overview"
    getSystemSummary: builder.query<SystemSummaryResponse, void>({
      query: () => "/dashboard/system-summary",
      providesTags: ["Dashboard"],
      transformResponse: (response: SystemSummaryResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Organisation Metrics - "Organisation counts"
    getOrganisationMetrics: builder.query<OrganisationMetricsResponse, void>({
      query: () => "/dashboard/organisation-metrics",
      providesTags: ["Dashboard"],
      transformResponse: (response: OrganisationMetricsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get User Metrics - "Users by role"
    getUserMetrics: builder.query<UserMetricsResponse, void>({
      query: () => "/dashboard/user-metrics",
      providesTags: ["Dashboard"],
      transformResponse: (response: UserMetricsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Account Manager Metrics - "Managed companies count"
    getAccountManagerMetrics: builder.query<
      AccountManagerMetricsResponse,
      void
    >({
      query: () => "/dashboard/account-manager-metrics",
      providesTags: ["Dashboard"],
      transformResponse: (response: AccountManagerMetricsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Activity Metrics - "High-level system activity"
    getActivityMetrics: builder.query<ActivityMetricsResponse, void>({
      query: () => "/dashboard/activity-metrics",
      providesTags: ["Dashboard"],
      transformResponse: (response: ActivityMetricsResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Status Overview - "Active / inactive entities"
    getStatusOverview: builder.query<StatusOverviewResponse, void>({
      query: () => "/dashboard/status-overview",
      providesTags: ["Dashboard"],
      transformResponse: (response: StatusOverviewResponse) => {
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
  useGetSystemSummaryQuery,
  useGetOrganisationMetricsQuery,
  useGetUserMetricsQuery,
  useGetAccountManagerMetricsQuery,
  useGetActivityMetricsQuery,
  useGetStatusOverviewQuery,
} = dashboardApi

