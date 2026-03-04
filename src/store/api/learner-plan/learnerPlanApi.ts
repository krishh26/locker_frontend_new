import { createApi } from "@reduxjs/toolkit/query/react";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import type {
  LearningPlanListRequest,
  LearningPlanListResponse,
  UpdateSessionRequest,
  CreateLearnerPlanRequest,
  CreateLearnerPlanResponse,
  AddActionRequest,
  EditActionRequest,
} from "./types";
import { baseQuery } from "@/store/api/baseQuery";

// Legacy types for backward compatibility
export interface LearnerPlanItem {
  learner_plan_id: number;
  startDate: string;
  Duration: string;
  [key: string]: unknown;
}

export const learnerPlanApi = createApi({
  reducerPath: "learnerPlanApi",
  baseQuery,
  tagTypes: ["LearnerPlanList"],
  endpoints: (builder) => ({
    getLearnerPlanList: builder.query<
      LearningPlanListResponse,
      LearningPlanListRequest
    >({
      query: (params) => {
        const queryString = Object.keys(params)
          .filter((key) => {
            const value = params[key as keyof LearningPlanListRequest];
            return value !== "" && value !== undefined && value !== null;
          })
          .map(
            (key) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(
                String(params[key as keyof LearningPlanListRequest])
              )}`
          )
          .join("&");
        const url = `/learner-plan/list${queryString ? `?${queryString}` : ""}`;
        return url;
      },
      providesTags: ["LearnerPlanList"],
      transformResponse: (response: LearningPlanListResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSession: builder.mutation<
      { status: boolean; message?: string; error?: string },
      UpdateSessionRequest
    >({
      query: (data) => ({
        url: `/learner-plan/update/${data.id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
    deleteLearnerPlan: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (id) => ({
        url: `/learner-plan/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
    createLearnerPlan: builder.mutation<
      CreateLearnerPlanResponse,
      CreateLearnerPlanRequest
    >({
      query: (body) => ({
        url: "/learner-plan/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["LearnerPlanList"],
      transformResponse: (response: { status: boolean; message?: string; error?: string; data?: unknown }) => {
        if (response.status === false) {
          throw new Error(
            response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE
          );
        }
        return response as CreateLearnerPlanResponse;
      },
    }),
    addAction: builder.mutation<
      { status: boolean; message?: string; error?: string },
      AddActionRequest
    >({
      query: (data) => ({
        url: `/learner-action/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
    editAction: builder.mutation<
      { status: boolean; message?: string; error?: string },
      EditActionRequest
    >({
      query: (data) => ({
        url: `/learner-action/update/${data.id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
    addFormToLearner: builder.mutation<
      { status: boolean; message?: string; error?: string },
      FormData
    >({
      query: (formData) => ({
        url: `/learner-document/create`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
    getFormListOfLearner: builder.query<
      { status: boolean; data?: unknown[]; error?: string },
      { id: number }
    >({
      query: ({ id }) => ({
        url: `/learner-document/learner-plan/${id}`,
      }),
    }),
    uploadActionFile: builder.mutation<
      { status: boolean; message?: string; error?: string },
      { id: number; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/learner-action/upload/${id}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LearnerPlanList"],
    }),
  }),
});

export const {
  useGetLearnerPlanListQuery,
  useLazyGetLearnerPlanListQuery,
  useUpdateSessionMutation,
  useCreateLearnerPlanMutation,
  useDeleteLearnerPlanMutation,
  useAddActionMutation,
  useEditActionMutation,
  useAddFormToLearnerMutation,
  useGetFormListOfLearnerQuery,
  useUploadActionFileMutation,
} = learnerPlanApi;

