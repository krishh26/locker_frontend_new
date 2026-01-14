import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  EvidenceListParams,
  EvidenceListResponse,
  EvidenceDetailResponse,
  EvidenceUpdateRequest,
  EvidenceReuploadRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const evidenceApi = createApi({
  reducerPath: "evidenceApi",
  baseQuery,
  tagTypes: ["Evidence"],
  endpoints: (builder) => ({
    getEvidenceList: builder.query<EvidenceListResponse, EvidenceListParams>({
      query: (params) => {
        const queryString = Object.keys(params)
          .filter((key) => params[key as keyof EvidenceListParams] !== "" && params[key as keyof EvidenceListParams] !== undefined && params[key as keyof EvidenceListParams] !== null)
          .map(
            (key) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key as keyof EvidenceListParams]))}`
          )
          .join("&");
        return `/assignment/list${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Evidence"],
      transformResponse: (response: EvidenceListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getEvidenceDetails: builder.query<EvidenceDetailResponse, number>({
      query: (id) => `/assignment/get/${id}`,
      providesTags: (result, error, id) => [{ type: "Evidence", id }],
      transformResponse: (response: EvidenceDetailResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createEvidence: builder.mutation<EvidenceDetailResponse, FormData>({
      query: (formData) => ({
        url: "/assignment/create",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Evidence"],
      transformResponse: (response: EvidenceDetailResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateEvidence: builder.mutation<
      EvidenceDetailResponse,
      { id: number; data: EvidenceUpdateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/assignment/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Evidence", id },
        "Evidence",
      ],
      transformResponse: (response: EvidenceDetailResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteEvidence: builder.mutation<EvidenceDetailResponse, number>({
      query: (id) => ({
        url: `/assignment/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Evidence"],
      transformResponse: (response: EvidenceDetailResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    reuploadEvidence: builder.mutation<
      EvidenceDetailResponse,
      { id: number; data: EvidenceReuploadRequest }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        formData.append("file", data.file);
        return {
          url: `/assignment/${id}/reupload`,
          method: "PATCH",
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [{ type: "Evidence", id }, "Evidence"],
      transformResponse: (response: EvidenceDetailResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // AssignmentMapping endpoints
    getAssignmentMappings: builder.query({
      query: (params) => {
        const queryString = Object.keys(params)
          .filter((key) => params[key] !== null && params[key] !== undefined && params[key] !== "")
          .map(
            (key) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
          )
          .join("&");
        const url = `assignment/get-mapped${queryString ? `?${queryString}` : ""}`;
        return { url, method: "GET" };
      },
    }),
    upsertAssignmentMapping: builder.mutation({
      query: (data) => ({
        url: `/assignment/mapping`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Evidence", id: arg.assignment_id },
        "Evidence",
      ],
    }),
    deleteAssignmentMapping: builder.mutation({
      query: ({ mapping_id }) => ({
        url: `/assignment-mapping/delete/${mapping_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Evidence"],
    }),
    // Mapping-based signatures
    getMappingSignatureList: builder.query({
      query: ({ mapping_id }) => ({
        url: `/assignment-mapping/${mapping_id}/signatures`,
        method: "GET",
      }),
    }),
    // Update PC ticks (learnerMap/trainerMap/signedOff) for mapping
    updateMappingPC: builder.mutation({
      query: ({ mapping_id, data }) => ({
        url: `/assignment-mapping/${mapping_id}/pc`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Evidence"],
    }),
    // Pending signatures
    pendingSignatureList: builder.query({
      query: ({ id }) => ({
        url: `/user/${id}/pending-signatures`,
        method: "GET",
      }),
    }),
    uploadExternalEvidenceFile: builder.mutation({
      query: ({ id, data }) => ({
        url: `/assignment/${id}/external-feedback`,
        method: "POST",
        body: data,
      }),
    }),
    requestSignature: builder.mutation({
      query: ({ id, data }) => ({
        url: `/assignment/${id}/request-signature`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetEvidenceListQuery,
  useGetEvidenceDetailsQuery,
  useCreateEvidenceMutation,
  useUpdateEvidenceMutation,
  useDeleteEvidenceMutation,
  useReuploadEvidenceMutation,
  useGetAssignmentMappingsQuery,
  useUpsertAssignmentMappingMutation,
  useDeleteAssignmentMappingMutation,
  useGetMappingSignatureListQuery,
  useUpdateMappingPCMutation,
  usePendingSignatureListQuery,
  useUploadExternalEvidenceFileMutation,
  useRequestSignatureMutation,
} = evidenceApi;

