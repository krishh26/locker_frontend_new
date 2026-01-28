import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  FeatureResponse,
  FeatureListResponse,
  CreateFeatureRequest,
  UpdateFeatureLimitsRequest,
  MapFeatureToPlanRequest,
  CheckFeatureAccessRequest,
  CheckFeatureAccessResponse,
  CheckUsageCountRequest,
  CheckUsageCountResponse,
  EnableReadOnlyModeRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const featureControlApi = createApi({
  reducerPath: "featureControlApi",
  baseQuery,
  tagTypes: ["Feature", "FeaturePlan"],
  endpoints: (builder) => ({
    // Define Feature - "Create feature"
    createFeature: builder.mutation<FeatureResponse, CreateFeatureRequest>({
      query: (body) => ({
        url: "/feature-control/features",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Feature"],
      transformResponse: (response: FeatureResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // List Features
    getFeatures: builder.query<FeatureListResponse, void>({
      query: () => "/feature-control/features",
      providesTags: ["Feature"],
      transformResponse: (response: FeatureListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Feature Details
    getFeature: builder.query<FeatureResponse, number>({
      query: (id) => `/feature-control/features/${id}`,
      providesTags: ["Feature"],
      transformResponse: (response: FeatureResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Map Feature to Plan - "Feature availability"
    mapFeatureToPlan: builder.mutation<
      FeatureResponse,
      MapFeatureToPlanRequest
    >({
      query: (body) => ({
        url: "/feature-control/features/map-to-plan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Feature", "FeaturePlan"],
      transformResponse: (response: FeatureResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Update Feature Limits - "Change limits"
    updateFeatureLimits: builder.mutation<
      FeatureResponse,
      UpdateFeatureLimitsRequest
    >({
      query: ({ featureId, limits }) => ({
        url: `/feature-control/features/${featureId}/limits`,
        method: "PUT",
        body: { limits },
      }),
      invalidatesTags: ["Feature"],
      transformResponse: (response: FeatureResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Check Feature Access - "Runtime check"
    checkFeatureAccess: builder.mutation<
      CheckFeatureAccessResponse,
      CheckFeatureAccessRequest
    >({
      query: (body) => ({
        url: "/feature-control/check-access",
        method: "POST",
        body,
      }),
      transformResponse: (response: CheckFeatureAccessResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Check Usage Count - "Validate limits"
    checkUsageCount: builder.mutation<
      CheckUsageCountResponse,
      CheckUsageCountRequest
    >({
      query: (body) => ({
        url: "/feature-control/check-usage",
        method: "POST",
        body,
      }),
      transformResponse: (response: CheckUsageCountResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Block Restricted Action - "Prevent access"
    blockRestrictedAction: builder.mutation<
      { status: boolean; message?: string },
      { featureCode: string; organisationId?: number; centreId?: number }
    >({
      query: (body) => ({
        url: "/feature-control/block-action",
        method: "POST",
        body,
      }),
      transformResponse: (response: { status: boolean; message?: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Enable Read-Only Mode - "Expiry handling"
    enableReadOnlyMode: builder.mutation<
      { status: boolean; message?: string },
      EnableReadOnlyModeRequest
    >({
      query: (body) => ({
        url: "/feature-control/read-only-mode",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Feature"],
      transformResponse: (response: { status: boolean; message?: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useCreateFeatureMutation,
  useGetFeaturesQuery,
  useGetFeatureQuery,
  useMapFeatureToPlanMutation,
  useUpdateFeatureLimitsMutation,
  useCheckFeatureAccessMutation,
  useCheckUsageCountMutation,
  useBlockRestrictedActionMutation,
  useEnableReadOnlyModeMutation,
} = featureControlApi
