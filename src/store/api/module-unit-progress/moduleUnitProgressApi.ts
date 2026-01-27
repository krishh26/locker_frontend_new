import { createApi } from "@reduxjs/toolkit/query/react";
import type { ModuleUnitProgressResponse, LearnerUnitProgressResponse } from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const moduleUnitProgressApi = createApi({
  reducerPath: "moduleUnitProgressApi",
  baseQuery,
  tagTypes: ["ModuleUnitProgress"],
  endpoints: (builder) => ({
    getModuleUnitProgress: builder.query<ModuleUnitProgressResponse, number>({
      query: (learnerId) => `/learner/get/${learnerId}`,
      providesTags: ["ModuleUnitProgress"],
      transformResponse: (response: ModuleUnitProgressResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnerUnitsProgress: builder.query<
      LearnerUnitProgressResponse,
      { learner_id: number; course_id: number }
    >({
      query: ({ learner_id, course_id }) =>
        `/learner-units/${learner_id}/${course_id}`,
      providesTags: ["ModuleUnitProgress"],
      transformResponse: (response: LearnerUnitProgressResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetModuleUnitProgressQuery,
  useLazyGetModuleUnitProgressQuery,
  useGetLearnerUnitsProgressQuery,
} = moduleUnitProgressApi;

