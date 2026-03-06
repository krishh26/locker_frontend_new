import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AcknowledgementListResponse,
  AcknowledgementResponse,
  AcknowledgementFilters,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

function buildAcknowledgementQueryParams(filters?: AcknowledgementFilters | null): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.organisation_id != null && !Number.isNaN(filters.organisation_id)) {
    params.set("organisation_id", String(filters.organisation_id));
  }
  if (filters.centre_id != null && !Number.isNaN(filters.centre_id)) {
    params.set("centre_id", String(filters.centre_id));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

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
    getAcknowledgements: builder.query<AcknowledgementListResponse, AcknowledgementFilters | void>({
      query: (filters) => `/acknowledgement/get-all${buildAcknowledgementQueryParams(filters ?? undefined)}`,
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
      { id: string; data: FormData; organisation_id?: number; centre_id?: number }
    >({
      query: ({ id, data, organisation_id, centre_id }) => {
        const encodedId = encodeURIComponent(String(id));
        const params = new URLSearchParams();
        if (organisation_id != null && !Number.isNaN(organisation_id)) params.set("organisation_id", String(organisation_id));
        if (centre_id != null && !Number.isNaN(centre_id)) params.set("centre_id", String(centre_id));
        const q = params.toString();
        return {
          url: `/acknowledgement/update/${encodedId}${q ? `?${q}` : ""}`,
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
      { id: string; organisation_id?: number; centre_id?: number }
    >({
      query: ({ id, organisation_id, centre_id }) => {
        const encodedId = encodeURIComponent(String(id));
        const params = new URLSearchParams();
        if (organisation_id != null && !Number.isNaN(organisation_id)) params.set("organisation_id", String(organisation_id));
        if (centre_id != null && !Number.isNaN(centre_id)) params.set("centre_id", String(centre_id));
        const q = params.toString();
        return {
          url: `/acknowledgement/delete/${encodedId}${q ? `?${q}` : ""}`,
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
      AcknowledgementFilters | void
    >({
      query: (filters) => ({
        url: `/acknowledgement/clear-all${buildAcknowledgementQueryParams(filters ?? undefined)}`,
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
