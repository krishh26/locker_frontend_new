import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  LearnerResponse,
  LearnerListResponse,
  LearnerFilters,
  CreateLearnerRequest,
  UpdateLearnerRequest,
  UpdateLearnerCommentRequest,
  BulkCreateLearnersRequest,
  BulkCreateLearnersResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const learnerApi = createApi({
  reducerPath: "learnerApi",
  baseQuery,
  tagTypes: ["Learner"],
  endpoints: (builder) => ({
    getLearnerDetails: builder.query<LearnerResponse, number>({
      query: (learnerId) => `/learner/get/${learnerId}`,
      providesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnersList: builder.query<LearnerListResponse, LearnerFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "", course_id = "", employer_id = "", status = "" } = filters;
        let url = `/learner/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        if (course_id) {
          url += `&course_id=${encodeURIComponent(course_id)}`;
        }
        if (employer_id) {
          url += `&employer_id=${encodeURIComponent(employer_id)}`;
        }
        if (status) {
          url += `&status=${encodeURIComponent(status)}`;
        }
        return url;
      },
      providesTags: ["Learner"],
      transformResponse: (response: LearnerListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createLearner: builder.mutation<LearnerResponse, CreateLearnerRequest>({
      query: (body) => ({
        url: "/learner/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateLearner: builder.mutation<LearnerResponse, { id: number; data: UpdateLearnerRequest }>({
      query: ({ id, data }) => ({
        url: `/learner/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteLearner: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/learner/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateLearnerComment: builder.mutation<LearnerResponse, { id: number; data: UpdateLearnerCommentRequest }>({
      query: ({ id, data }) => ({
        url: `/learner/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    bulkCreateLearners: builder.mutation<BulkCreateLearnersResponse, BulkCreateLearnersRequest>({
      query: (body) => ({
        url: "/learner/bulk-upload",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: BulkCreateLearnersResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetLearnerDetailsQuery,
  useLazyGetLearnerDetailsQuery,
  useGetLearnersListQuery,
  useCreateLearnerMutation,
  useUpdateLearnerMutation,
  useDeleteLearnerMutation,
  useUpdateLearnerCommentMutation,
  useBulkCreateLearnersMutation,
} = learnerApi;

