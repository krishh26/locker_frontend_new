import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  EmployerListResponse,
  EmployerFilters,
  CreateEmployerRequest,
  UpdateEmployerRequest,
  EmployerResponse,
  BulkCreateEmployerRequest,
  BulkCreateEmployerResponse,
  UploadFileResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const employerApi = createApi({
  reducerPath: "employerApi",
  baseQuery,
  tagTypes: ["Employer"],
  endpoints: (builder) => ({
    getEmployers: builder.query<EmployerListResponse, EmployerFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "" } = filters;
        let url = `/employer/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        return url;
      },
      providesTags: ["Employer"],
      transformResponse: (response: EmployerListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getEmployer: builder.query<EmployerResponse, number>({
      query: (employerId) => `/employer/get/${employerId}`,
      providesTags: ["Employer"],
      transformResponse: (response: EmployerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createEmployer: builder.mutation<EmployerResponse, CreateEmployerRequest>({
      query: (body) => ({
        url: "/employer/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employer"],
      transformResponse: (response: EmployerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateEmployer: builder.mutation<EmployerResponse, { id: number; data: UpdateEmployerRequest }>({
      query: ({ id, data }) => ({
        url: `/employer/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Employer"],
      transformResponse: (response: EmployerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteEmployer: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/employer/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employer"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    bulkCreateEmployers: builder.mutation<BulkCreateEmployerResponse, BulkCreateEmployerRequest>({
      query: (body) => ({
        url: "/employer/bulk-create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employer"],
      transformResponse: (response: BulkCreateEmployerResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    uploadEmployerFile: builder.mutation<UploadFileResponse, FormData>({
      query: (formData) => {
        formData.append("folder", "employer");
        return {
          url: "/upload/files",
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: UploadFileResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetEmployersQuery,
  useGetEmployerQuery,
  useCreateEmployerMutation,
  useUpdateEmployerMutation,
  useDeleteEmployerMutation,
  useBulkCreateEmployersMutation,
  useUploadEmployerFileMutation,
} = employerApi;

