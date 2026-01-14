import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ResourceListRequest,
  ResourceListResponse,
  ResourceResponse,
  ResourceCreateRequest,
  ResourceUpdateRequest,
  CourseResourceListRequest,
  CourseResourceListResponse,
  ResourceAccessRequest,
  ResourceAccessResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const resourcesApi = createApi({
  reducerPath: "resourcesApi",
  baseQuery,
  tagTypes: ["Resource"],
  endpoints: (builder) => ({
    getResources: builder.query<ResourceListResponse, ResourceListRequest>({
      query: ({ page = 1, page_size = 25, search = "", job_type = "" }) => {
        let url = `/resource/list?page=${page}&limit=${page_size}&meta=true`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        if (job_type) {
          url += `&job_type=${job_type}`;
        }
        return url;
      },
      providesTags: ["Resource"],
      transformResponse: (response: ResourceListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createResource: builder.mutation<ResourceResponse, ResourceCreateRequest>({
      query: (body) => {
        // If it's FormData, send it as is (for file uploads)
        if (body instanceof FormData) {
          return {
            url: "/resource/create",
            method: "POST",
            body,
          };
        }
        // Otherwise, convert to FormData if file is present
        const formData = new FormData();
        Object.keys(body).forEach((key) => {
          const value = body[key as keyof typeof body];
          if (value !== undefined && value !== null) {
            if (key === "file" && value instanceof File) {
              formData.append(key, value);
            } else {
              formData.append(key, String(value));
            }
          }
        });
        return {
          url: "/resource/create",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Resource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateResource: builder.mutation<
      ResourceResponse,
      { id: string; data: ResourceUpdateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/resource/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Resource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteResource: builder.mutation<ResourceResponse, string>({
      query: (id) => ({
        url: `/resource/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Resource"],
      transformResponse: (response: ResourceResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    exportResourcesPdf: builder.mutation<Blob, void>({
      query: () => ({
        url: "/resource/export/pdf",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
    exportResourcesCsv: builder.mutation<Blob, void>({
      query: () => ({
        url: "/resource/export/csv",
        method: "GET",
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
    getResourcesByCourse: builder.query<
      CourseResourceListResponse,
      CourseResourceListRequest
    >({
      query: ({ course_id, user_id, search = "", job_type = "" }) => {
        let url = `/resource/list-by-course?course_id=${course_id}&user_id=${user_id}`;
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        if (job_type) {
          url += `&job_type=${encodeURIComponent(job_type)}`;
        }
        return url;
      },
      providesTags: ["Resource"],
      transformResponse: (response: CourseResourceListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    trackResourceAccess: builder.mutation<
      ResourceAccessResponse,
      ResourceAccessRequest
    >({
      query: (body) => ({
        url: "/resource-status/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Resource"],
      transformResponse: (response: ResourceAccessResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetResourcesQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useExportResourcesPdfMutation,
  useExportResourcesCsvMutation,
  useGetResourcesByCourseQuery,
  useTrackResourceAccessMutation,
} = resourcesApi;
