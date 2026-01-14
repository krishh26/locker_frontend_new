import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SessionTypesResponse,
  SessionTypeResponse,
  CreateSessionTypePayload,
  UpdateSessionTypePayload,
  ReorderSessionTypePayload,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const sessionTypeApi = createApi({
  reducerPath: "sessionTypeApi",
  baseQuery,
  tagTypes: ["SessionType"],
  endpoints: (builder) => ({
    getSessionTypes: builder.query<SessionTypesResponse, void>({
      query: () => "/sessionType/list",
      providesTags: ["SessionType"],
      transformResponse: (response: any) => {
        if (response?.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        // Transform snake_case to camelCase
        if (response?.data && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              isOffTheJob: item.is_off_the_job ?? item.isOffTheJob,
              isActive: item.active ?? item.isActive,
              order: item.order,
              createdAt: item.created_at ?? item.createdAt,
              updatedAt: item.updated_at ?? item.updatedAt,
            })),
          };
        }
        return response;
      },
    }),
    createSessionType: builder.mutation<
      SessionTypeResponse,
      CreateSessionTypePayload
    >({
      query: (payload) => ({
        url: "/sessionType/create",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SessionType"],
      transformResponse: (response: any) => {
        if (response?.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (response?.data) {
          return {
            ...response,
            data: {
              id: response.data.id,
              name: response.data.name,
              isOffTheJob: response.data.is_off_the_job ?? response.data.isOffTheJob,
              isActive: response.data.active ?? response.data.isActive,
              order: response.data.order,
              createdAt: response.data.created_at ?? response.data.createdAt,
              updatedAt: response.data.updated_at ?? response.data.updatedAt,
            },
          };
        }
        return response;
      },
    }),
    updateSessionType: builder.mutation<
      SessionTypeResponse,
      { id: number; payload: UpdateSessionTypePayload }
    >({
      query: ({ id, payload }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sessionType/update/${encodedId}`,
          method: "PUT",
          body: payload,
        };
      },
      invalidatesTags: ["SessionType"],
      transformResponse: (response: any) => {
        if (response?.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (response?.data) {
          return {
            ...response,
            data: {
              id: response.data.id,
              name: response.data.name,
              isOffTheJob: response.data.is_off_the_job ?? response.data.isOffTheJob,
              isActive: response.data.active ?? response.data.isActive,
              order: response.data.order,
              createdAt: response.data.created_at ?? response.data.createdAt,
              updatedAt: response.data.updated_at ?? response.data.updatedAt,
            },
          };
        }
        return response;
      },
    }),
    toggleSessionType: builder.mutation<
      SessionTypeResponse,
      { id: number; isActive: boolean }
    >({
      query: ({ id, isActive }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/user-defined-lists/session-types/${encodedId}`,
          method: "PATCH",
          body: { isActive },
        };
      },
      invalidatesTags: ["SessionType"],
      transformResponse: (response: any) => {
        if (response?.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    reorderSessionType: builder.mutation<
      SessionTypesResponse,
      ReorderSessionTypePayload
    >({
      query: (payload) => ({
        url: "/sessionType/reorder",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["SessionType"],
      transformResponse: (response: any) => {
        if (response?.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (response?.data && Array.isArray(response.data)) {
          return {
            ...response,
            data: response.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              isOffTheJob: item.is_off_the_job ?? item.isOffTheJob,
              isActive: item.active ?? item.isActive,
              order: item.order,
              createdAt: item.created_at ?? item.createdAt,
              updatedAt: item.updated_at ?? item.updatedAt,
            })),
          };
        }
        return response;
      },
    }),
    deleteSessionType: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/user-defined-lists/session-types/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SessionType"],
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
  useGetSessionTypesQuery,
  useCreateSessionTypeMutation,
  useUpdateSessionTypeMutation,
  useToggleSessionTypeMutation,
  useReorderSessionTypeMutation,
  useDeleteSessionTypeMutation,
} = sessionTypeApi;
