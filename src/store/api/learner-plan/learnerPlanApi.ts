import { createApi } from "@reduxjs/toolkit/query/react";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import type {
  LearningPlanListRequest,
  LearningPlanListResponse,
  UpdateSessionRequest,
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
  useAddActionMutation,
  useEditActionMutation,
  useAddFormToLearnerMutation,
  useGetFormListOfLearnerQuery,
  useUploadActionFileMutation,
} = learnerPlanApi;

