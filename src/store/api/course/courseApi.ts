import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CourseListResponse,
  CourseFilters,
  CourseResponse,
  CourseFormData,
  CourseCreateResponse,
  CourseUpdateResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";
import { clearCoursesList } from "@/store/slices/cacheSlice";

export const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery,
  tagTypes: ["Course"],
  endpoints: (builder) => ({
    getCourses: builder.query<CourseListResponse, CourseFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "", core_type = "" } = filters;
        let url = `/course/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        if (core_type) {
          url += `&core_type=${encodeURIComponent(core_type)}`;
        }
        return url;
      },
      providesTags: ["Course"],
      transformResponse: (response: CourseListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getCourse: builder.query<CourseResponse, number>({
      query: (courseId) => `/course/get/${courseId}`,
      providesTags: ["Course"],
      transformResponse: (response: CourseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createCourse: builder.mutation<CourseCreateResponse, CourseFormData>({
      query: (data) => ({
        url: "/course/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Course"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear courses cache after successful creation
          dispatch(clearCoursesList());
        } catch {
          // Do nothing on error, let the error be handled by the mutation
        }
      },
      transformResponse: (response: CourseCreateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateCourse: builder.mutation<CourseUpdateResponse, { id: number; data: CourseFormData }>({
      query: ({ id, data }) => ({
        url: `/course/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Course", id: arg.id },
        "Course",
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear courses cache after successful update
          dispatch(clearCoursesList());
        } catch {
          // Do nothing on error, let the error be handled by the mutation
        }
      },
      transformResponse: (response: CourseUpdateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getGatewayCourses: builder.query<CourseListResponse, void>({
      query: () => `/course/list?limit=100&core_type=Gateway`,
      providesTags: ["Course"],
      transformResponse: (response: CourseListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getStandardCourses: builder.query<CourseListResponse, void>({
      query: () => `/course/list?limit=100&core_type=Standard`,
      providesTags: ["Course"],
      transformResponse: (response: CourseListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        // Filter for active courses only (active = true)
        if (response?.data) {
          return {
            ...response,
            data: response.data.filter((course) => course.active === true),
          };
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useGetGatewayCoursesQuery,
  useGetStandardCoursesQuery,
} = courseApi;

