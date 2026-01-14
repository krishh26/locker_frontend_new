import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AcknowledgementListResponse,
  AcknowledgementResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const acknowledgementApi = createApi({
  reducerPath: "acknowledgementApi",
  baseQuery,
  tagTypes: ["Acknowledgement"],
  endpoints: (builder) => ({
    createAcknowledgement: builder.mutation<
      AcknowledgementResponse,
      FormData
    >({
      query: (formData) => ({
        url: "/acknowledgement/create",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Acknowledgement"],
      transformResponse: (response: AcknowledgementResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getAcknowledgements: builder.query<AcknowledgementListResponse, void>({
      query: () => "/acknowledgement/get-all",
      providesTags: ["Acknowledgement"],
      transformResponse: (response: AcknowledgementListResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateAcknowledgement: builder.mutation<
      AcknowledgementResponse,
      { id: string; data: FormData }
    >({
      query: ({ id, data }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/acknowledgement/update/${encodedId}`,
          method: "PUT",
          body: data,
        };
      },
      invalidatesTags: ["Acknowledgement"],
      transformResponse: (response: AcknowledgementResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteAcknowledgement: builder.mutation<
      { status: boolean; message?: string; error?: string },
      { id: string }
    >({
      query: ({ id }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/acknowledgement/delete/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["Acknowledgement"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    clearAllAcknowledgements: builder.mutation<
      { status: boolean; message?: string; error?: string },
      void
    >({
      query: () => ({
        url: "/acknowledgement/clear-all",
        method: "DELETE",
      }),
      invalidatesTags: ["Acknowledgement"],
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
  useCreateAcknowledgementMutation,
  useGetAcknowledgementsQuery,
  useUpdateAcknowledgementMutation,
  useDeleteAcknowledgementMutation,
  useClearAllAcknowledgementsMutation,
} = acknowledgementApi;
