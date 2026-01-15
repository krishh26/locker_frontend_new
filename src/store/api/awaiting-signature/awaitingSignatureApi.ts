import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AwaitingSignatureListRequest,
  AwaitingSignatureListResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const awaitingSignatureApi = createApi({
  reducerPath: "awaitingSignatureApi",
  baseQuery,
  tagTypes: ["AwaitingSignature"],
  endpoints: (builder) => ({
    getAwaitingSignatureList: builder.query<
      AwaitingSignatureListResponse,
      AwaitingSignatureListRequest
    >({
      query: (params) => {
        const queryParams: string[] = [];
        
        if (params.page) {
          queryParams.push(`page=${params.page}`);
        }
        if (params.limit) {
          queryParams.push(`limit=${params.limit}`);
        }
        if (params.assessor_id) {
          queryParams.push(`assessor_id=${encodeURIComponent(params.assessor_id)}`);
        }
        if (params.course_id) {
          queryParams.push(`course_id=${encodeURIComponent(params.course_id)}`);
        }
        if (params.learner_name) {
          queryParams.push(`learner_name=${encodeURIComponent(params.learner_name)}`);
        }
        if (params.meta) {
          queryParams.push(`meta=${params.meta}`);
        }
        
        const queryString = queryParams.join("&");
        return `/assignment/list-with-signatures${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["AwaitingSignature"],
      transformResponse: (response: AwaitingSignatureListResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const { useGetAwaitingSignatureListQuery } = awaitingSignatureApi;

