import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  PendingSignatureListResponse,
  SaveSignatureRequest,
  SaveSignatureResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const documentsToSignApi = createApi({
  reducerPath: "documentsToSignApi",
  baseQuery,
  tagTypes: ["PendingSignature"],
  endpoints: (builder) => ({
    getPendingSignatures: builder.query<PendingSignatureListResponse, { id: string }>({
      query: ({ id }) => `/user/${id}/pending-signatures`,
      providesTags: ["PendingSignature"],
      transformResponse: (response: PendingSignatureListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveSignature: builder.mutation<
      SaveSignatureResponse,
      { id: string; data: SaveSignatureRequest }
    >({
      query: ({ id, data }) => ({
        url: `/assignment/${id}/sign`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PendingSignature"],
      transformResponse: (response: SaveSignatureResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetPendingSignaturesQuery,
  useSaveSignatureMutation,
} = documentsToSignApi;

