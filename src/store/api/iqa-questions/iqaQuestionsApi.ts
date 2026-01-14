import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  IQAQuestionListResponse,
  IQAQuestionResponse,
  CreateIQAQuestionPayload,
  UpdateIQAQuestionPayload,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const iqaQuestionsApi = createApi({
  reducerPath: "iqaQuestionsApi",
  baseQuery,
  tagTypes: ["IQAQuestion"],
  endpoints: (builder) => ({
    getIQAQuestions: builder.query<
      IQAQuestionListResponse,
      { questionType?: string }
    >({
      query: ({ questionType }) => {
        const params = questionType
          ? `?questionType=${encodeURIComponent(questionType)}`
          : "";
        return `/iqa-questions/admin/questions${params}`;
      },
      providesTags: ["IQAQuestion"],
      transformResponse: (response: IQAQuestionListResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createIQAQuestion: builder.mutation<
      IQAQuestionResponse,
      CreateIQAQuestionPayload
    >({
      query: (payload) => ({
        url: "/iqa-questions/admin/questions",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["IQAQuestion"],
      transformResponse: (response: IQAQuestionResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateIQAQuestion: builder.mutation<
      IQAQuestionResponse,
      { id: number; payload: UpdateIQAQuestionPayload }
    >({
      query: ({ id, payload }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/iqa-questions/admin/questions/${encodedId}`,
          method: "PATCH",
          body: payload,
        };
      },
      invalidatesTags: ["IQAQuestion"],
      transformResponse: (response: IQAQuestionResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteIQAQuestion: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/iqa-questions/admin/questions/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["IQAQuestion"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetIQAQuestionsQuery,
  useCreateIQAQuestionMutation,
  useUpdateIQAQuestionMutation,
  useDeleteIQAQuestionMutation,
} = iqaQuestionsApi;
