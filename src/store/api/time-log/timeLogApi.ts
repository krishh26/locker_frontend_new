import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  TimeLogListRequest,
  TimeLogListResponse,
  TimeLogSliceResponse,
  TimeLogSpendResponse,
  TimeLogCreateRequest,
  TimeLogUpdateRequest,
  TimeLogResponse,
  OtjSummaryRequest,
  OtjSummaryResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const timeLogApi = createApi({
  reducerPath: "timeLogApi",
  baseQuery,
  tagTypes: ["TimeLog"],
  endpoints: (builder) => ({
    getTimeLogs: builder.query<TimeLogListResponse, TimeLogListRequest>({
      query: ({ page = 1, page_size = 10, user_id, course_id, type, approved }) => {
        let url = `/time-log/list?pagination=true&meta=true&page=${page}&limit=${page_size}&user_id=${user_id}`;
        if (course_id) {
          url += `&course_id=${course_id}`;
        }
        if (type && type !== "All") {
          url += `&type=${encodeURIComponent(type)}`;
        }
        if (approved && approved !== "All") {
          url += `&approved=${approved}`;
        }
        return url;
      },
      providesTags: ["TimeLog"],
      transformResponse: (response: TimeLogListResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getTimeLogSlice: builder.query<
      TimeLogSliceResponse,
      { user_id: string; course_id?: string | null; type?: string }
    >({
      query: ({ user_id, course_id, type }) => {
        let url = `/time-log/slice?user_id=${user_id}`;
        if (course_id) {
          url += `&course_id=${course_id}`;
        }
        if (type && type !== "All") {
          url += `&type=${encodeURIComponent(type)}`;
        }
        return url;
      },
      providesTags: ["TimeLog"],
      transformResponse: (response: TimeLogSliceResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getTimeLogSpend: builder.query<
      TimeLogSpendResponse,
      { user_id: string; course_id?: string | null; type?: string }
    >({
      query: ({ user_id, course_id, type }) => {
        let url = `/time-log/spend?user_id=${user_id}`;
        if (course_id) {
          url += `&course_id=${course_id}`;
        }
        if (type && type !== "All") {
          url += `&type=${encodeURIComponent(type)}`;
        }
        return url;
      },
      providesTags: ["TimeLog"],
      transformResponse: (response: TimeLogSpendResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createTimeLog: builder.mutation<TimeLogResponse, TimeLogCreateRequest>({
      query: (body) => ({
        url: "/time-log/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TimeLog"],
      transformResponse: (response: TimeLogResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateTimeLog: builder.mutation<TimeLogResponse, TimeLogUpdateRequest>({
      query: ({ id, ...body }) => ({
        url: `/time-log/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["TimeLog"],
      transformResponse: (response: TimeLogResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteTimeLog: builder.mutation<TimeLogResponse, string>({
      query: (id) => ({
        url: `/time-log/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TimeLog"],
      transformResponse: (response: TimeLogResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getOtjSummary: builder.query<OtjSummaryResponse, OtjSummaryRequest>({
      query: ({ learner_id, courseId, includeUnverified = true }) => {
        let url = `/time-log/otj-summary/${learner_id}?includeUnverified=${includeUnverified}`;
        if (courseId) {
          url += `&courseId=${courseId}`;
        }
        return url;
      },
      providesTags: ["TimeLog"],
      transformResponse: (response: OtjSummaryResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetTimeLogsQuery,
  useGetTimeLogSliceQuery,
  useGetTimeLogSpendQuery,
  useCreateTimeLogMutation,
  useUpdateTimeLogMutation,
  useDeleteTimeLogMutation,
  useGetOtjSummaryQuery,
} = timeLogApi;
