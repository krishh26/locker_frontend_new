import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  UnitsListResponse,
  SaveUnitsRequest,
  SaveUnitsResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const unitsApi = createApi({
  reducerPath: "unitsApi",
  baseQuery,
  tagTypes: ["Units"],
  endpoints: (builder) => ({
    getUnitsByCourse: builder.query<UnitsListResponse, number>({
      query: (courseId) => {
        return `/learner-units/courses/${courseId}/units`;
      },
      providesTags: ["Units"],
      transformResponse: (response: UnitsListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveSelectedUnits: builder.mutation<SaveUnitsResponse, SaveUnitsRequest>({
      query: (body) => ({
        url: "/learner-units/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Units"],
      transformResponse: (response: SaveUnitsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetUnitsByCourseQuery,
  useSaveSelectedUnitsMutation,
} = unitsApi;

