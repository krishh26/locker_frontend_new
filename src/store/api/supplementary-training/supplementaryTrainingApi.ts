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
  ToggleResourceRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const supplementaryTrainingApi = createApi({
  reducerPath: "supplementaryTrainingApi",
  baseQuery,
  tagTypes: ["SupplementaryTrainingResource", "LearnerSupplementaryTrainingActivity"],
  endpoints: (builder) => ({
    // Admin Resource Management Endpoints
    getAdminSupTrainingResources: builder.query<AdminResourcesResponse, AdminResourcesRequest>({
      query: ({ search, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        return `/supplementary-training/admin/resources?${params.toString()}`;
      },
      providesTags: ["SupplementaryTrainingResource"],
      transformResponse: (response: AdminResourcesResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    addSupTrainingResource: builder.mutation<ResourceResponse, FormData>({
      query: (body) => ({
        url: "/supplementary-training/admin/resources",
        method: "POST",
        body,
        formData: true,
      }),
      invalidatesTags: ["SupplementaryTrainingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSupTrainingResource: builder.mutation<ResourceResponse, { id: string; payload: FormData }>({
      query: ({ id, payload }) => ({
        url: `/supplementary-training/admin/resources/${id}`,
        method: "PATCH",
        body: payload,
        formData: true,
      }),
      invalidatesTags: ["SupplementaryTrainingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    toggleSupTrainingResource: builder.mutation<ResourceResponse, ToggleResourceRequest>({
      query: ({ id, isActive }) => ({
        url: `/supplementary-training/admin/resources/${id}`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["SupplementaryTrainingResource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSupTrainingResource: builder.mutation<{ status: boolean; message: string }, string>({
      query: (id) => ({
        url: `/supplementary-training/admin/resources/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SupplementaryTrainingResource"],
      transformResponse: (response: { status: boolean; message: string }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnerSupTrainingResources: builder.query<LearnerResourcesResponse, void>({
      query: () => "/supplementary-training/learner/resources",
      providesTags: ["SupplementaryTrainingResource", "LearnerSupplementaryTrainingActivity"],
      transformResponse: (response: LearnerResourcesResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    trackSupTrainingResourceOpen: builder.mutation<TrackResourceOpenResponse, TrackResourceOpenRequest>({
      query: (body) => ({
        url: "/supplementary-training/learner/resources/track",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LearnerSupplementaryTrainingActivity"],
      transformResponse: (response: TrackResourceOpenResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    submitSupTrainingFeedback: builder.mutation<SubmitFeedbackResponse, SubmitFeedbackRequest>({
      query: (body) => ({
        url: "/supplementary-training/learner/resources/feedback",
        method: "POST",
        body: {
          resourceId: typeof body.resourceId === 'string' ? parseInt(body.resourceId) : body.resourceId,
          feedback: body.feedback,
        },
      }),
      invalidatesTags: ["LearnerSupplementaryTrainingActivity"],
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
  useGetLearnerSupTrainingResourcesQuery,
  useTrackSupTrainingResourceOpenMutation,
  useSubmitSupTrainingFeedbackMutation,
  useGetAdminSupTrainingResourcesQuery,
  useAddSupTrainingResourceMutation,
  useUpdateSupTrainingResourceMutation,
  useToggleSupTrainingResourceMutation,
  useDeleteSupTrainingResourceMutation,
} = supplementaryTrainingApi;
