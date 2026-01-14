import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  DefaultReviewWeeksConfigResponse,
  SaveDefaultReviewWeeksConfigRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const defaultReviewWeeksApi = createApi({
  reducerPath: "defaultReviewWeeksApi",
  baseQuery,
  tagTypes: ["DefaultReviewWeeks"],
  endpoints: (builder) => ({
    getDefaultReviewWeeksConfig: builder.query<
      DefaultReviewWeeksConfigResponse,
      void
    >({
      query: () => "/review-setting/get",
      providesTags: ["DefaultReviewWeeks"],
      transformResponse: (response: DefaultReviewWeeksConfigResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveDefaultReviewWeeksConfig: builder.mutation<
      DefaultReviewWeeksConfigResponse,
      SaveDefaultReviewWeeksConfigRequest
    >({
      query: (body) => ({
        url: "/review-setting/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DefaultReviewWeeks"],
      transformResponse: (response: DefaultReviewWeeksConfigResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetDefaultReviewWeeksConfigQuery,
  useSaveDefaultReviewWeeksConfigMutation,
} = defaultReviewWeeksApi;
