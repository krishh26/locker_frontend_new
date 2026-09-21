import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Course,
  CourseListResponse,
  CourseFilters,
  CourseResponse,
  CourseFormData,
  CourseCreateResponse,
  CourseUpdateResponse,
  AddCourseFromLibraryRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";
import { clearCoursesList } from "@/store/slices/cacheSlice";

/** Soft-deleted courses are marked active=false (BE no longer hard-deletes). */
const isActiveCourse = (course: Course) => course.active !== false;
const isArchivedCourse = (course: Course) => course.active === false;

const filterCoursesByStatus = (
  response: CourseListResponse,
  status: CourseFilters["status"] = "active",
): CourseListResponse => {
  if (!response?.data) return response;
  if (status === "all") return response;
  if (status === "archived") {
    return { ...response, data: response.data.filter(isArchivedCourse) };
  }
  return { ...response, data: response.data.filter(isActiveCourse) };
};

export const courseApi = createApi({
  reducerPath: "courseApi",
  baseQuery,
  tagTypes: ["Course"],
  endpoints: (builder) => ({
    getCourses: builder.query<CourseListResponse, CourseFilters>({
      query: (filters = {}) => {
        const {
          page = 1,
          page_size = 10,
          keyword = "",
          core_type = "",
          scope = "organisation",
          status = "active",
        } = filters;
        // Archive / all need a wider fetch since BE list does not filter by active
        const limit =
          status === "archived" || status === "all"
            ? Math.max(page_size, 1000)
            : page_size;
        let url = `/course/list?page=${page}&limit=${limit}&meta=true&scope=${encodeURIComponent(scope)}`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        if (core_type) {
          url += `&core_type=${encodeURIComponent(core_type)}`;
        }
        return url;
      },
      providesTags: ["Course"],
      transformResponse: (
        response: CourseListResponse,
        _meta,
        arg: CourseFilters,
      ) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return filterCoursesByStatus(response, arg?.status ?? "active");
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
    updateCourse: builder.mutation<
      CourseUpdateResponse,
      { id: number; data: CourseFormData; silent?: boolean }
    >({
      query: ({ id, data }) => ({
        url: `/course/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      // Silent autosave: do not invalidate — refetch would reset the live form mid-edit.
      // Manual update still refreshes list + detail caches.
      invalidatesTags: (result, error, arg) =>
        arg.silent
          ? []
          : [{ type: "Course", id: arg.id }, "Course"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Autosave must not thrash the courses list cache
          if (!arg.silent) {
            dispatch(clearCoursesList());
          }
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
    deleteCourse: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/course/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Course"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear courses cache after successful deletion
          dispatch(clearCoursesList());
        } catch {
          // Do nothing on error, let the error be handled by the mutation
        }
      },
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    addCourseFromLibrary: builder.mutation<
      CourseCreateResponse,
      AddCourseFromLibraryRequest
    >({
      query: (body) => ({
        url: "/course/add-from-library",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Course"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCoursesList());
        } catch {
          // handled by caller
        }
      },
      transformResponse: (response: CourseCreateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getGatewayCourses: builder.query<CourseListResponse, void>({
      query: () => `/course/list?limit=100&core_type=Gateway&scope=organisation`,
      providesTags: ["Course"],
      transformResponse: (response: CourseListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return filterCoursesByStatus(response, "active");
      },
    }),
    getStandardCourses: builder.query<CourseListResponse, void>({
      query: () => `/course/list?limit=100&core_type=Standard&scope=organisation`,
      providesTags: ["Course"],
      transformResponse: (response: CourseListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return filterCoursesByStatus(response, "active");
      },
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useAddCourseFromLibraryMutation,
  useGetGatewayCoursesQuery,
  useGetStandardCoursesQuery,
} = courseApi;

