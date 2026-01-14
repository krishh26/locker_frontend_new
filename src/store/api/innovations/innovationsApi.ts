import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  InnovationsListResponse,
  CreateInnovationRequest,
  CreateInnovationResponse,
  UpdateInnovationRequest,
  UpdateInnovationResponse,
  DeleteInnovationRequest,
  DeleteInnovationResponse,
  GetInnovationCommentsRequest,
  InnovationCommentsResponse,
  CreateInnovationCommentRequest,
  CreateInnovationCommentResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const innovationsApi = createApi({
  reducerPath: "innovationsApi",
  baseQuery,
  tagTypes: ["Innovation", "InnovationComment"],
  endpoints: (builder) => ({
    getInnovations: builder.query<
      InnovationsListResponse,
      { page?: number; page_size?: number; userId?: number }
    >({
      query: ({ page = 1, page_size = 10, userId }) => {
        let url = `/innovation/list?meta=true&page=${page}&limit=${page_size}`;
        if (userId) {
          url = `${url}&user_id=${userId}`;
        }
        return url;
      },
      providesTags: ["Innovation"],
      transformResponse: (response: InnovationsListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    createInnovation: builder.mutation<
      CreateInnovationResponse,
      CreateInnovationRequest
    >({
      query: (body) => ({
        url: "/innovation/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Innovation"],
      transformResponse: (response: CreateInnovationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    updateInnovation: builder.mutation<
      UpdateInnovationResponse,
      UpdateInnovationRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/innovation/update/${id}`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["Innovation", "InnovationComment"],
      transformResponse: (response: UpdateInnovationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    deleteInnovation: builder.mutation<
      DeleteInnovationResponse,
      DeleteInnovationRequest
    >({
      query: ({ id }) => ({
        url: `/innovation/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Innovation"],
      transformResponse: (response: DeleteInnovationResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    getInnovationComments: builder.query<
      InnovationCommentsResponse,
      GetInnovationCommentsRequest
    >({
      query: ({ innovationId }) => ({
        url: `/innovation/get/${innovationId}`,
      }),
      providesTags: ["InnovationComment", "Innovation"],
      transformResponse: (response: InnovationCommentsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),

    createInnovationComment: builder.mutation<
      CreateInnovationCommentResponse,
      CreateInnovationCommentRequest
    >({
      query: (body) => ({
        url: `/innovation/comment`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }),
      invalidatesTags: ["InnovationComment", "Innovation"],
      transformResponse: (response: CreateInnovationCommentResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetInnovationsQuery,
  useCreateInnovationMutation,
  useUpdateInnovationMutation,
  useDeleteInnovationMutation,
  useGetInnovationCommentsQuery,
  useCreateInnovationCommentMutation,
} = innovationsApi;

