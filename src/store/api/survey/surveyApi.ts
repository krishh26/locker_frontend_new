import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  GetSurveysResponse,
  GetSurveyResponse,
  CreateSurveyResponse,
  UpdateSurveyResponse,
  DeleteSurveyResponse,
  GetSurveysQueryParams,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  GetQuestionsResponse,
  CreateQuestionResponse,
  UpdateQuestionResponse,
  DeleteQuestionResponse,
  ReorderQuestionsResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  GetResponsesResponse,
  GetResponseResponse,
  SubmitResponseResponse,
  DeleteResponseResponse,
  GetResponsesQueryParams,
  SubmitResponseRequest,
  ApplyTemplateRequest,
  ApplyTemplateResponse,
  GetPublicSurveyResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const surveyApi = createApi({
  reducerPath: "surveyApi",
  baseQuery,
  tagTypes: ["Survey", "Question", "Response"],
  endpoints: (builder) => ({
    // 1.1 Get All Surveys
    getSurveys: builder.query<GetSurveysResponse, GetSurveysQueryParams | void>({
      query: (params) => {
        const {
          status,
          userId,
          organizationId,
          page = 1,
          limit = 10,
          search,
        } = (params || {}) as GetSurveysQueryParams;
        let url = `/surveys?page=${page}&limit=${limit}`;
        
        if (status) {
          url += `&status=${status}`;
        }
        if (userId) {
          url += `&userId=${userId}`;
        }
        if (organizationId) {
          url += `&organizationId=${organizationId}`;
        }
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        
        return url;
      },
      providesTags: ["Survey"],
      transformResponse: (response: GetSurveysResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 1.2 Get Survey by ID
    getSurveyById: builder.query<GetSurveyResponse, string>({
      query: (surveyId) => `/surveys/${surveyId}`,
      providesTags: (result, error, surveyId) => [{ type: "Survey", id: surveyId }],
      transformResponse: (response: GetSurveyResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 1.3 Create Survey
    createSurvey: builder.mutation<CreateSurveyResponse, CreateSurveyRequest>({
      query: (body) => ({
        url: `/surveys`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Survey"],
      transformResponse: (response: CreateSurveyResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 1.4 Update Survey
    updateSurvey: builder.mutation<
      UpdateSurveyResponse,
      { surveyId: string; updates: UpdateSurveyRequest }
    >({
      query: ({ surveyId, updates }) => ({
        url: `/surveys/${surveyId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
        "Survey",
      ],
      transformResponse: (response: UpdateSurveyResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 1.5 Delete Survey
    deleteSurvey: builder.mutation<DeleteSurveyResponse, string>({
      query: (surveyId) => ({
        url: `/surveys/${surveyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, surveyId) => [
        { type: "Survey", id: surveyId },
        "Survey",
      ],
      transformResponse: (response: DeleteSurveyResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 1.6 Get Public Survey with Questions (No Auth Required)
    getPublicSurvey: builder.query<GetPublicSurveyResponse, string>({
      query: (surveyId) => ({
        url: `/surveys/public/${surveyId}`,
        headers: {
          // Explicitly don't send auth header for public endpoint
          Authorization: undefined,
        },
      }),
      providesTags: (result, error, surveyId) => [
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: GetPublicSurveyResponse) => {
        if (!response?.success) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 2.1 Get Questions for Survey
    getQuestions: builder.query<GetQuestionsResponse, string>({
      query: (surveyId) => `/surveys/${surveyId}/questions`,
      providesTags: (result, error, surveyId) => [
        { type: "Question", id: `LIST-${surveyId}` },
      ],
      transformResponse: (response: GetQuestionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 2.2 Create Question
    createQuestion: builder.mutation<
      CreateQuestionResponse,
      { surveyId: string; question: CreateQuestionRequest }
    >({
      query: ({ surveyId, question }) => ({
        url: `/surveys/${surveyId}/questions`,
        method: "POST",
        body: question,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Question", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: CreateQuestionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 2.3 Update Question
    updateQuestion: builder.mutation<
      UpdateQuestionResponse,
      { surveyId: string; questionId: string; updates: UpdateQuestionRequest }
    >({
      query: ({ surveyId, questionId, updates }) => ({
        url: `/surveys/${surveyId}/questions/${questionId}`,
        method: "PUT",
        body: updates,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Question", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: UpdateQuestionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 2.4 Delete Question
    deleteQuestion: builder.mutation<
      DeleteQuestionResponse,
      { surveyId: string; questionId: string }
    >({
      query: ({ surveyId, questionId }) => ({
        url: `/surveys/${surveyId}/questions/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Question", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: DeleteQuestionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 2.5 Reorder Questions
    reorderQuestions: builder.mutation<
      ReorderQuestionsResponse,
      { surveyId: string; questionIds: string[] }
    >({
      query: ({ surveyId, questionIds }) => ({
        url: `/surveys/${surveyId}/questions/reorder`,
        method: "PATCH",
        body: { questionIds },
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Question", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: ReorderQuestionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 3.1 Get Responses for Survey
    getResponses: builder.query<
      GetResponsesResponse,
      { surveyId: string; params?: GetResponsesQueryParams }
    >({
      query: ({ surveyId, params = {} }) => {
        const { page = 1, limit = 10, startDate, endDate } = params;
        let url = `/surveys/${surveyId}/responses?page=${page}&limit=${limit}`;
        
        if (startDate) {
          url += `&startDate=${encodeURIComponent(startDate)}`;
        }
        if (endDate) {
          url += `&endDate=${encodeURIComponent(endDate)}`;
        }
        
        return url;
      },
      providesTags: (result, error, { surveyId }) => [
        { type: "Response", id: `LIST-${surveyId}` },
      ],
      transformResponse: (response: GetResponsesResponse) => {
        if (!response?.success) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 3.2 Get Response by ID
    getResponseById: builder.query<
      GetResponseResponse,
      { surveyId: string; responseId: string }
    >({
      query: ({ surveyId, responseId }) => `/surveys/${surveyId}/responses/${responseId}`,
      providesTags: (result, error, { surveyId, responseId }) => [
        { type: "Response", id: responseId },
        { type: "Response", id: `LIST-${surveyId}` },
      ],
      transformResponse: (response: GetResponseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 3.3 Submit Survey Response (Public Endpoint)
    submitResponse: builder.mutation<
      SubmitResponseResponse,
      { surveyId: string; response: SubmitResponseRequest }
    >({
      query: ({ surveyId, response }) => ({
        url: `/surveys/${surveyId}/responses`,
        method: "POST",
        body: response,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Response", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: SubmitResponseResponse) => {
        if (!response?.success) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 3.4 Delete Response
    deleteResponse: builder.mutation<
      DeleteResponseResponse,
      { surveyId: string; responseId: string }
    >({
      query: ({ surveyId, responseId }) => ({
        url: `/surveys/${surveyId}/responses/${responseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Response", id: `LIST-${surveyId}` },
        { type: "Survey", id: surveyId },
      ],
      transformResponse: (response: DeleteResponseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    // 4. Apply Template (Background + Questions in one call)
    applyTemplate: builder.mutation<
      ApplyTemplateResponse,
      { surveyId: string; template: ApplyTemplateRequest }
    >({
      query: ({ surveyId, template }) => ({
        url: `/surveys/${surveyId}/apply-template`,
        method: "POST",
        body: template,
      }),
      invalidatesTags: (result, error, { surveyId }) => [
        { type: "Survey", id: surveyId },
        { type: "Question", id: `LIST-${surveyId}` },
        "Survey",
      ],
      transformResponse: (response: ApplyTemplateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetSurveysQuery,
  useGetSurveyByIdQuery,
  useCreateSurveyMutation,
  useUpdateSurveyMutation,
  useDeleteSurveyMutation,
  useGetPublicSurveyQuery,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useReorderQuestionsMutation,
  useGetResponsesQuery,
  useGetResponseByIdQuery,
  useSubmitResponseMutation,
  useDeleteResponseMutation,
  useApplyTemplateMutation,
} = surveyApi;

// Re-export types for convenience
export type { Survey, SurveyStatus, Question, QuestionType, Response } from "./types";

