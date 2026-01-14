import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  FundingBandListResponse,
  FundingBandResponse,
  CreateFundingBandRequest,
  UpdateFundingBandRequest,
  FundingBandFilters,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const fundingBandApi = createApi({
  reducerPath: "fundingBandApi",
  baseQuery,
  tagTypes: ["FundingBand"],
  endpoints: (builder) => ({
    getFundingBands: builder.query<FundingBandListResponse, FundingBandFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "" } = filters;
        // Build query string with optional pagination
        const params = new URLSearchParams();
        if (page) params.append("page", page.toString());
        if (page_size) params.append("limit", page_size.toString());
        params.append("meta", "true");
        if (keyword) {
          params.append("keyword", keyword);
        }
        const queryString = params.toString();
        return `/funding-band${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["FundingBand"],
      transformResponse: (response: FundingBandListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        // Ensure meta_data exists for pagination
        if (!response.meta_data && response.data) {
          response.meta_data = {
            page: 1,
            pages: 1,
            items: response.data.length,
            page_size: response.data.length,
          };
        }
        return response;
      },
    }),
    createFundingBand: builder.mutation<FundingBandResponse, CreateFundingBandRequest>({
      query: (body) => ({
        url: "/funding-band",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FundingBand"],
      transformResponse: (response: FundingBandResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateFundingBand: builder.mutation<
      FundingBandResponse,
      { id: number; data: UpdateFundingBandRequest }
    >({
      query: ({ id, data }) => ({
        url: `/funding-band/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["FundingBand"],
      transformResponse: (response: FundingBandResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetFundingBandsQuery,
  useCreateFundingBandMutation,
  useUpdateFundingBandMutation,
} = fundingBandApi;

