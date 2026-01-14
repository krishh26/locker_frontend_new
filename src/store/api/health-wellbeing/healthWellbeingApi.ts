import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  LearnerResourcesResponse,
  TrackResourceOpenRequest,
  TrackResourceOpenResponse,
  SubmitFeedbackRequest,
  SubmitFeedbackResponse,
  AdminResourcesRequest,
  AdminResourcesResponse,
  ResourceResponse,
  AddResourcePayload,
  UpdateResourcePayload,
  ToggleResourceRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const healthWellbeingApi = createApi({
  reducerPath: "healthWellbeingApi",
  baseQuery,
  tagTypes: ["WellbeingResource", "LearnerResourceActivity"],
  endpoints: (builder) => ({
    // Admin Resource Management Endpoints
    getAdminResources: builder.query<AdminResourcesResponse, AdminResourcesRequest>({
      query: ({ search, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        return `/wellbeing/admin/resources?${params.toString()}`;
      },
      providesTags: ["WellbeingResource"],
      transformResponse: (response: AdminResourcesResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    addResource: builder.mutation<ResourceResponse, AddResourcePayload>({
      query: (body) => ({
        url: "/wellbeing/admin/resources",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WellbeingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateResource: builder.mutation<ResourceResponse, { id: string; payload: UpdateResourcePayload }>({
      query: ({ id, payload }) => ({
        url: `/wellbeing/admin/resources/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["WellbeingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    toggleResource: builder.mutation<ResourceResponse, ToggleResourceRequest>({
      query: ({ id, isActive }) => ({
        url: `/wellbeing/admin/resources/${id}`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["WellbeingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteResource: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({
        url: `/wellbeing/admin/resources/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WellbeingResource"],
      transformResponse: (response: { status: boolean; message: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnerResources: builder.query<LearnerResourcesResponse, void>({
      query: () => "/wellbeing/learner/resources",
      providesTags: ["WellbeingResource", "LearnerResourceActivity"],
      transformResponse: (response: LearnerResourcesResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    trackResourceOpen: builder.mutation<TrackResourceOpenResponse, TrackResourceOpenRequest>({
      query: (body) => ({
        url: "/wellbeing/learner/resources/track",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LearnerResourceActivity"],
      transformResponse: (response: TrackResourceOpenResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    submitFeedback: builder.mutation<SubmitFeedbackResponse, SubmitFeedbackRequest>({
      query: (body) => ({
        url: "/wellbeing/learner/resources/feedback",
        method: "POST",
        body: {
          resourceId: typeof body.resourceId === 'string' ? parseInt(body.resourceId) : body.resourceId,
          feedback: body.feedback,
        },
      }),
      invalidatesTags: ["LearnerResourceActivity"],
      transformResponse: (response: SubmitFeedbackResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetLearnerResourcesQuery,
  useTrackResourceOpenMutation,
  useSubmitFeedbackMutation,
  useGetAdminResourcesQuery,
  useAddResourceMutation,
  useUpdateResourceMutation,
  useToggleResourceMutation,
  useDeleteResourceMutation,
} = healthWellbeingApi;
