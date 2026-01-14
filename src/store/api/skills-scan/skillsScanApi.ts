import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CourseUnit,
  UpdateCourseUnitSkillRequest,
  UpdateCourseUnitSkillResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export type CourseDetailsResponse = {
  status: boolean;
  data?: {
    course?: {
      units: CourseUnit[];
      course_core_type?: string;
    };
    units?: CourseUnit[];
  };
  message?: string;
  error?: string;
};

export const skillsScanApi = createApi({
  reducerPath: "skillsScanApi",
  baseQuery,
  tagTypes: ["SkillsScan"],
  endpoints: (builder) => ({
    getCourseDetails: builder.query<
      CourseDetailsResponse,
      { learner_id: string; course_id: string }
    >({
      query: ({ learner_id, course_id }) =>
        `/course/user/get?learner_id=${learner_id}&course_id=${course_id}`,
      providesTags: ["SkillsScan"],
      transformResponse: (response: CourseDetailsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateCourseUnitSkill: builder.mutation<
      UpdateCourseUnitSkillResponse,
      { userCourseId: string; data: UpdateCourseUnitSkillRequest }
    >({
      query: ({ userCourseId, data }) => ({
        url: `/course/user/update/${userCourseId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SkillsScan"],
      transformResponse: (response: UpdateCourseUnitSkillResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetCourseDetailsQuery,
  useUpdateCourseUnitSkillMutation,
} = skillsScanApi;

