import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CpdEntryRequest,
  CpdEntryResponse,
  CpdListResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const cpdApi = createApi({
  reducerPath: "cpdApi",
  baseQuery,
  tagTypes: ["CpdEntry"],
  endpoints: (builder) => ({
    getCpdEntries: builder.query<CpdListResponse, void>({
      query: () => "/cpd/learner/list",
      providesTags: ["CpdEntry"],
      transformResponse: (response: CpdListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createCpdEntry: builder.mutation<CpdEntryResponse, CpdEntryRequest>({
      query: (body) => ({
        url: "/cpd/learner/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CpdEntry"],
      transformResponse: (response: CpdEntryResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateCpdEntry: builder.mutation<
      CpdEntryResponse,
      { id: string; data: CpdEntryRequest }
    >({
      query: ({ id, data }) => ({
        url: `/cpd/learner/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CpdEntry"],
      transformResponse: (response: CpdEntryResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteCpdEntry: builder.mutation<CpdEntryResponse, string>({
      query: (id) => ({
        url: `/cpd/learner/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CpdEntry"],
      transformResponse: (response: CpdEntryResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    exportCpdPdf: builder.mutation<Blob, void>({
      query: () => ({
        url: "/cpd/learner/export/pdf",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
    exportCpdCsv: builder.mutation<Blob, void>({
      query: () => ({
        url: "/cpd/learner/export/csv",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
  }),
});

export const {
  useGetCpdEntriesQuery,
  useCreateCpdEntryMutation,
  useUpdateCpdEntryMutation,
  useDeleteCpdEntryMutation,
  useExportCpdPdfMutation,
  useExportCpdCsvMutation,
} = cpdApi;

