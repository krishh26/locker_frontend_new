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

type RawSessionType = {
  id: number;
  name: string;
  is_off_the_job?: boolean;
  isOffTheJob?: boolean;
  active?: boolean;
  isActive?: boolean;
  order: number;
  centre_id?: number | null;
  centreId?: number | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type RawSessionTypeListResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: RawSessionType[];
};

type RawSessionTypeSingleResponse = {
  status: boolean;
  message?: string;
  error?: string;
  data?: RawSessionType;
};

export const sessionTypeApi = createApi({
  reducerPath: "sessionTypeApi",
  baseQuery,
  tagTypes: ["SessionType"],
  endpoints: (builder) => ({
    getSessionTypes: builder.query<SessionTypesResponse, void>({
      query: () => "/sessionType/list",
      providesTags: ["SessionType"],
      transformResponse: (response: unknown): SessionTypesResponse => {
        const raw = response as RawSessionTypeListResponse;

        if (raw?.status === false) {
          throw new Error(raw.error ?? raw.message ?? DEFAULT_ERROR_MESSAGE);
        }
        // Transform snake_case to camelCase
        if (raw?.data && Array.isArray(raw.data)) {
          return {
            ...(raw as Omit<RawSessionTypeListResponse, "data">),
            data: raw.data.map((item: RawSessionType) => ({
              id: item.id,
              name: item.name,
              isOffTheJob: item.is_off_the_job ?? item.isOffTheJob ?? false,
              isActive: item.active ?? item.isActive ?? true,
              order: item.order,
              centreId: item.centre_id ?? item.centreId ?? null,
              createdAt: item.created_at ?? item.createdAt,
              updatedAt: item.updated_at ?? item.updatedAt,
            })),
          };
        }
        return raw as SessionTypesResponse;
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
      transformResponse: (response: unknown): SessionTypeResponse => {
        const raw = response as RawSessionTypeSingleResponse;

        if (raw?.status === false) {
          throw new Error(raw.error ?? raw.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (raw?.data) {
          return {
            ...(raw as Omit<RawSessionTypeSingleResponse, "data">),
            data: {
              id: raw.data.id,
              name: raw.data.name,
              isOffTheJob: raw.data.is_off_the_job ?? raw.data.isOffTheJob ?? false,
              isActive: raw.data.active ?? raw.data.isActive ?? true,
              order: raw.data.order,
              centreId: raw.data.centre_id ?? raw.data.centreId ?? null,
              createdAt: raw.data.created_at ?? raw.data.createdAt,
              updatedAt: raw.data.updated_at ?? raw.data.updatedAt,
            },
          };
        }
        return raw as SessionTypeResponse;
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
      transformResponse: (response: unknown): SessionTypeResponse => {
        const raw = response as RawSessionTypeSingleResponse;

        if (raw?.status === false) {
          throw new Error(raw.error ?? raw.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (raw?.data) {
          return {
            ...(raw as Omit<RawSessionTypeSingleResponse, "data">),
            data: {
              id: raw.data.id,
              name: raw.data.name,
              isOffTheJob: raw.data.is_off_the_job ?? raw.data.isOffTheJob ?? false,
              isActive: raw.data.active ?? raw.data.isActive ?? true,
              order: raw.data.order,
              centreId: raw.data.centre_id ?? raw.data.centreId ?? null,
              createdAt: raw.data.created_at ?? raw.data.createdAt,
              updatedAt: raw.data.updated_at ?? raw.data.updatedAt,
            },
          };
        }
        return raw as SessionTypeResponse;
      },
    }),
    toggleSessionType: builder.mutation<
      SessionTypeResponse,
      { id: number; isActive: boolean }
    >({
      query: ({ id, isActive }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sessionType/update/${encodedId}`,
          method: "PATCH",
          body: { isActive },
        };
      },
      invalidatesTags: ["SessionType"],
      transformResponse: (response: unknown): SessionTypeResponse => {
        const raw = response as SessionTypeResponse;

        if (raw?.status === false) {
          throw new Error(raw.error ?? raw.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return raw;
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
      transformResponse: (response: unknown): SessionTypesResponse => {
        const raw = response as RawSessionTypeListResponse;

        if (raw?.status === false) {
          throw new Error(raw.error ?? raw.message ?? DEFAULT_ERROR_MESSAGE);
        }
        if (raw?.data && Array.isArray(raw.data)) {
          return {
            ...(raw as Omit<RawSessionTypeListResponse, "data">),
            data: raw.data.map((item: RawSessionType) => ({
              id: item.id,
              name: item.name,
              isOffTheJob: item.is_off_the_job ?? item.isOffTheJob ?? false,
              isActive: item.active ?? item.isActive ?? true,
              order: item.order,
              createdAt: item.created_at ?? item.createdAt,
              updatedAt: item.updated_at ?? item.updatedAt,
            })),
          };
        }
        return raw as SessionTypesResponse;
      },
    }),
    deleteSessionType: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sessionType/delete/${encodedId}`,
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
