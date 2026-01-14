import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CaseloadListResponse,
  CaseloadQueryParams,
  CaseloadDetailsResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const caseloadApi = createApi({
  reducerPath: "caseloadApi",
  baseQuery,
  tagTypes: ["Caseload"],
  endpoints: (builder) => ({
    getCaseloadList: builder.query<CaseloadListResponse, CaseloadQueryParams>({
      query: (params = {}) => {
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
          )
        );
        const searchParams = new URLSearchParams();
        Object.entries(filteredParams).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        const queryString = searchParams.toString();
        return `/user/line-managers${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Caseload"],
      transformResponse: (response: CaseloadListResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getCaseloadDetails: builder.query<CaseloadDetailsResponse, string | number>({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return `/caseload/${encodedId}`;
      },
      providesTags: ["Caseload"],
      transformResponse: (response: CaseloadDetailsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetCaseloadListQuery,
  useGetCaseloadDetailsQuery,
} = caseloadApi;
