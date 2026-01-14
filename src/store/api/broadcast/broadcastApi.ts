import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  BroadcastListResponse,
  BroadcastFilters,
  CreateBroadcastRequest,
  UpdateBroadcastRequest,
  BroadcastResponse,
  BroadcastMessageRequest,
  BroadcastMessageResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const broadcastApi = createApi({
  reducerPath: "broadcastApi",
  baseQuery,
  tagTypes: ["Broadcast"],
  endpoints: (builder) => ({
    getBroadcasts: builder.query<BroadcastListResponse, BroadcastFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "" } = filters;
        let url = `/broadcast/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        return url;
      },
      providesTags: ["Broadcast"],
      transformResponse: (response: BroadcastListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createBroadcast: builder.mutation<BroadcastResponse, CreateBroadcastRequest>({
      query: (body) => ({
        url: "/broadcast/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Broadcast"],
      transformResponse: (response: BroadcastResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateBroadcast: builder.mutation<BroadcastResponse, { id: number; data: UpdateBroadcastRequest }>({
      query: ({ id, data }) => ({
        url: `/broadcast/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Broadcast"],
      transformResponse: (response: BroadcastResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteBroadcast: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/broadcast/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Broadcast"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    sendBroadcastMessage: builder.mutation<BroadcastMessageResponse, BroadcastMessageRequest>({
      query: (body) => ({
        url: "/broadcast/message",
        method: "POST",
        body,
      }),
      transformResponse: (response: BroadcastMessageResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetBroadcastsQuery,
  useCreateBroadcastMutation,
  useUpdateBroadcastMutation,
  useDeleteBroadcastMutation,
  useSendBroadcastMessageMutation,
} = broadcastApi;

