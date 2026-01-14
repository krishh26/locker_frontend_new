import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  TrainerDetailsResponse,
  SaveRiskSettingsRequest,
  SaveRiskSettingsResponse,
  SaveCourseRiskRatingsRequest,
  SaveCourseRiskRatingsResponse,
  SaveCourseCommentRequest,
  SaveCourseCommentResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const trainerRiskRatingApi = createApi({
  reducerPath: "trainerRiskRatingApi",
  baseQuery,
  tagTypes: ["TrainerRisk"],
  endpoints: (builder) => ({
    getTrainerDetails: builder.query<TrainerDetailsResponse, number | string>({
      query: (trainerId) => `/course/trainer/${trainerId}`,
      providesTags: ["TrainerRisk"],
      transformResponse: (response: TrainerDetailsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveTrainerRiskSettings: builder.mutation<
      SaveRiskSettingsResponse,
      { trainerId: number; data: SaveRiskSettingsRequest }
    >({
      query: ({ trainerId, data }) => ({
        url: `/trainers/${trainerId}/risk-settings`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TrainerRisk"],
      transformResponse: (response: SaveRiskSettingsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveCourseRiskRatings: builder.mutation<
      SaveCourseRiskRatingsResponse,
      { data: SaveCourseRiskRatingsRequest }
    >({
      query: ({ data }) => ({
        url: `/risk-rating`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TrainerRisk"],
      transformResponse: (response: SaveCourseRiskRatingsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    saveCourseComment: builder.mutation<
      SaveCourseCommentResponse,
      { trainerId: number; body: SaveCourseCommentRequest }
    >({
      query: ({ trainerId, body }) => ({
        url: `/risk-rating/${trainerId}/course-comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["TrainerRisk"],
      transformResponse: (response: SaveCourseCommentResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetTrainerDetailsQuery,
  useSaveTrainerRiskSettingsMutation,
  useSaveCourseRiskRatingsMutation,
  useSaveCourseCommentMutation,
} = trainerRiskRatingApi;

