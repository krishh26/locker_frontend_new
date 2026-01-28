import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  SubscriptionResponse,
  SubscriptionListResponse,
  PlanResponse,
  PlanListResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
  AssignPlanToOrganisationRequest,
  ChangeOrganisationPlanRequest,
  SuspendOrganisationAccessRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  baseQuery,
  tagTypes: ["Subscription", "Plan"],
  endpoints: (builder) => ({
    // Existing: Get Subscription for Organisation
    getSubscription: builder.query<SubscriptionResponse, number>({
      query: (organisationId) => `/subscriptions/organisation/${organisationId}`,
      providesTags: ["Subscription"],
      transformResponse: (response: SubscriptionResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Existing: Get All Subscriptions
    getSubscriptions: builder.query<SubscriptionListResponse, void>({
      query: () => "/subscriptions",
      providesTags: ["Subscription"],
      transformResponse: (response: SubscriptionListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Create Plan - "Define plan"
    createPlan: builder.mutation<PlanResponse, CreatePlanRequest>({
      query: (body) => ({
        url: "/subscriptions/plans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plan"],
      transformResponse: (response: PlanResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // List Plans - "View plans"
    getPlans: builder.query<PlanListResponse, void>({
      query: () => "/subscriptions/plans",
      providesTags: ["Plan"],
      transformResponse: (response: PlanListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Get Plan Details - "Plan configuration"
    getPlan: builder.query<PlanResponse, number>({
      query: (id) => `/subscriptions/plans/${id}`,
      providesTags: ["Plan"],
      transformResponse: (response: PlanResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Update Plan - "Modify plan"
    updatePlan: builder.mutation<
      PlanResponse,
      { id: number; data: UpdatePlanRequest }
    >({
      query: ({ id, data }) => ({
        url: `/subscriptions/plans/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Plan"],
      transformResponse: (response: PlanResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Activate Plan - "Enable plan"
    activatePlan: builder.mutation<PlanResponse, number>({
      query: (id) => ({
        url: `/subscriptions/plans/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["Plan"],
      transformResponse: (response: PlanResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Deactivate Plan - "Disable plan"
    deactivatePlan: builder.mutation<PlanResponse, number>({
      query: (id) => ({
        url: `/subscriptions/plans/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: ["Plan"],
      transformResponse: (response: PlanResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Assign Plan to Organisation - "Apply plan"
    assignPlanToOrganisation: builder.mutation<
      SubscriptionResponse,
      AssignPlanToOrganisationRequest
    >({
      query: (body) => ({
        url: "/subscriptions/assign-plan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription", "Plan"],
      transformResponse: (response: SubscriptionResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Change Organisation Plan - "Upgrade/downgrade"
    changeOrganisationPlan: builder.mutation<
      SubscriptionResponse,
      ChangeOrganisationPlanRequest
    >({
      query: (body) => ({
        url: "/subscriptions/change-plan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription", "Plan"],
      transformResponse: (response: SubscriptionResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    // Suspend Organisation Access - "Restrict usage"
    suspendOrganisationAccess: builder.mutation<
      SubscriptionResponse,
      SuspendOrganisationAccessRequest
    >({
      query: (body) => ({
        url: "/subscriptions/suspend-access",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Subscription"],
      transformResponse: (response: SubscriptionResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetSubscriptionQuery,
  useGetSubscriptionsQuery,
  useCreatePlanMutation,
  useGetPlansQuery,
  useGetPlanQuery,
  useUpdatePlanMutation,
  useActivatePlanMutation,
  useDeactivatePlanMutation,
  useAssignPlanToOrganisationMutation,
  useChangeOrganisationPlanMutation,
  useSuspendOrganisationAccessMutation,
} = subscriptionApi
