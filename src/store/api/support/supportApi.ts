import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SupportListResponse,
  CreateSupportRequest,
  CreateSupportResponse,
  UpdateSupportRequest,
  UpdateSupportResponse,
  DeleteSupportRequest,
  DeleteSupportResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery,
  tagTypes: ["Support"],
  endpoints: (builder) => ({
    getSupportList: builder.query<
      SupportListResponse,
      { page?: number; page_size?: number; userId?: number }
    >({
      query: ({ page = 1, page_size = 10, userId }) => {
        let url = `/support/list?meta=true&page=${page}&limit=${page_size}`;
        if (userId) {
          url = `${url}&user_id=${userId}`;
        }
        return url;
      },
      providesTags: ["Support"],
      transformResponse: (response: SupportListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    createSupport: builder.mutation<
      CreateSupportResponse,
      CreateSupportRequest
    >({
      query: (body) => ({
        url: "/support/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Support"],
      transformResponse: (response: CreateSupportResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    updateSupport: builder.mutation<
      UpdateSupportResponse,
      UpdateSupportRequest
    >({
      query: ({ support_id, ...body }) => ({
        url: `/support/update/${support_id}`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Support"],
      transformResponse: (response: UpdateSupportResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    deleteSupport: builder.mutation<
      DeleteSupportResponse,
      DeleteSupportRequest
    >({
      query: ({ support_id }) => ({
        url: `/support/delete/${support_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Support"],
      transformResponse: (response: DeleteSupportResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetSupportListQuery,
  useCreateSupportMutation,
  useUpdateSupportMutation,
  useDeleteSupportMutation,
} = supportApi;

