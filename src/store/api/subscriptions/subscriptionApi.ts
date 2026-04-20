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

function toNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  return Number.isFinite(n) ? n : undefined
}

function normalizeSubscription(raw: unknown): SubscriptionResponse["data"] {
  const r = (raw ?? {}) as Record<string, unknown>

  const totalLicenses = toNumber(r.totalLicenses ?? r.total_licenses)
  const usedLicenses = toNumber(r.usedLicenses ?? r.used_licenses ?? r.usedUsers ?? r.used_users)
  const maxAllowedLicenses = toNumber(r.maxAllowedLicenses ?? r.max_allowed_licenses ?? r.userLimit ?? r.user_limit) ?? totalLicenses
  const remainingLicenses =
    toNumber(r.remainingLicenses ?? r.remaining_licenses) ??
    (maxAllowedLicenses != null && usedLicenses != null ? maxAllowedLicenses - usedLicenses : undefined)

  const warningThresholdPercentage = toNumber(
    r.warningThresholdPercentage ?? r.warning_threshold_percentage,
  )
  const tolerancePercentage = toNumber(r.tolerancePercentage ?? r.tolerance_percentage)

  const startDate = (r.startDate ?? r.start_date) as string | null | undefined
  const endDate = (r.endDate ?? r.end_date ?? r.expiryDate ?? r.expiry_date) as
    | string
    | null
    | undefined

  const status = (r.status as string | undefined) ?? undefined
  const warningStatus = (r.warningStatus ?? r.warning_status) as string | undefined

  const derivedUserLimit = maxAllowedLicenses ?? totalLicenses ?? toNumber(r.userLimit ?? r.user_limit) ?? 0
  const derivedUsedUsers = usedLicenses ?? toNumber(r.usedUsers ?? r.used_users) ?? 0

  const isExpired =
    typeof r.isExpired === "boolean"
      ? r.isExpired
      : status
        ? status !== "active"
        : endDate
          ? new Date(endDate).getTime() < Date.now()
          : false

  return {
    id: toNumber(r.id) ?? 0,
    organisationId: toNumber(r.organisationId ?? r.organisation_id ?? r.organisationId) ?? 0,
    plan: (r.plan as string | undefined) ?? (r.planName as string | undefined) ?? "—",
    status,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    totalLicenses,
    tolerancePercentage,
    warningThresholdPercentage,
    usedLicenses,
    maxAllowedLicenses,
    remainingLicenses,
    warningStatus,
    usedUsers: derivedUsedUsers,
    userLimit: derivedUserLimit,
    isExpired,
    expiryDate: typeof endDate === "string" ? endDate : typeof r.expiryDate === "string" ? (r.expiryDate as string) : "",
  }
}

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
        return {
          ...response,
          data: normalizeSubscription(response.data),
        }
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
        return {
          ...response,
          data: Array.isArray(response.data)
            ? response.data.map((s) => normalizeSubscription(s))
            : [],
        }
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
