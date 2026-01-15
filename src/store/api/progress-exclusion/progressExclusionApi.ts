import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ProgressExclusionResponse,
  UpdateProgressExclusionRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const progressExclusionApi = createApi({
  reducerPath: "progressExclusionApi",
  baseQuery,
  tagTypes: ["ProgressExclusion"],
  endpoints: (builder) => ({
    getProgressExclusion: builder.query<ProgressExclusionResponse, number>({
      query: (courseId) => `/progress-exclusion/${courseId}`,
      providesTags: ["ProgressExclusion"],
      transformResponse: (response: ProgressExclusionResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateProgressExclusion: builder.mutation<
      ProgressExclusionResponse,
      UpdateProgressExclusionRequest
    >({
      query: (body) => ({
        url: "/progress-exclusion/update",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ProgressExclusion"],
      transformResponse: (response: ProgressExclusionResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetProgressExclusionQuery,
  useUpdateProgressExclusionMutation,
} = progressExclusionApi;

