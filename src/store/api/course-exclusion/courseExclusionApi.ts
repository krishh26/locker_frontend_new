import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CourseExclusionGetArg,
  CourseExclusionGetResponse,
  CourseExclusionResponse,
  UpdateCourseExclusionRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

function normalizeCourseExclusionGet(
  response: CourseExclusionGetResponse,
  arg: CourseExclusionGetArg
): CourseExclusionResponse {
  if (response.status === false) {
    throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
  }
  const raw = response.data;
  let data: CourseExclusionResponse["data"];
  if (Array.isArray(raw)) {
    if (arg.course_id != null) {
      data = raw.find((r) => Number(r.course_id) === Number(arg.course_id));
    } else {
      data = raw[0];
    }
  } else {
    data = raw;
  }
  return {
    status: response.status,
    data,
    message: response.message,
    error: response.error,
  };
}

export const courseExclusionApi = createApi({
  reducerPath: "courseExclusionApi",
  baseQuery,
  tagTypes: ["CourseExclusion"],
  endpoints: (builder) => ({
    getCourseExclusion: builder.query<CourseExclusionResponse, CourseExclusionGetArg>({
      query: ({ organisation_id, course_id }) => {
        let url = `/course/exclusion?organisation_id=${encodeURIComponent(organisation_id)}`;
        if (course_id != null && !Number.isNaN(Number(course_id))) {
          url += `&course_id=${encodeURIComponent(course_id)}`;
        }
        return url;
      },
      providesTags: (_result, _err, arg) => [
        { type: "CourseExclusion" as const, id: `${arg.organisation_id}-${arg.course_id ?? "all"}` },
      ],
      transformResponse: (response: CourseExclusionGetResponse, _meta, arg) =>
        normalizeCourseExclusionGet(response, arg),
    }),
    updateCourseExclusion: builder.mutation<
      CourseExclusionResponse,
      UpdateCourseExclusionRequest
    >({
      query: (body) => ({
        url: "/course/exclusion",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "CourseExclusion" as const, id: `${arg.organisation_id}-${arg.course_id}` },
        { type: "CourseExclusion" as const, id: `${arg.organisation_id}-all` },
      ],
      transformResponse: (response: CourseExclusionGetResponse) => {
        if (response.status === false) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        const raw = response.data;
        const data = Array.isArray(raw) ? raw[0] : raw;
        return {
          status: response.status,
          data,
          message: response.message,
          error: response.error,
        };
      },
    }),
  }),
});

export const { useGetCourseExclusionQuery, useUpdateCourseExclusionMutation } = courseExclusionApi;
