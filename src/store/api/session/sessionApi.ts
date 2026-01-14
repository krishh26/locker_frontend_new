import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SessionListResponse,
  SessionFilters,
  SessionUpdateRequest,
  SessionCreateRequest,
  SessionResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const sessionApi = createApi({
  reducerPath: "sessionApi",
  baseQuery,
  tagTypes: ["Session"],
  endpoints: (builder) => ({
    getSessions: builder.query<SessionListResponse, SessionFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.page_size) params.append("page_size", filters.page_size.toString());
        if (filters?.trainer_id) params.append("trainer_id", filters.trainer_id);
        if (filters?.Attended) params.append("Attended", filters.Attended);
        if (filters?.sortBy) params.append("sortBy", filters.sortBy);
        
        const queryString = params.toString();
        return `/session/list${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Session"],
      transformResponse: (response: SessionListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSession: builder.mutation<
      SessionResponse,
      { id: number; data: SessionUpdateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/session/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Session"],
      transformResponse: (response: SessionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createSession: builder.mutation<SessionResponse, SessionCreateRequest>({
      query: (data) => ({
        url: `/session/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Session"],
      transformResponse: (response: SessionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSession: builder.mutation<SessionResponse, number>({
      query: (id) => ({
        url: `/session/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
      transformResponse: (response: SessionResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useUpdateSessionMutation,
  useCreateSessionMutation,
  useDeleteSessionMutation,
} = sessionApi;

