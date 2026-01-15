import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  UserListResponse,
  UserFilters,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  ChangeUserRoleRequest,
  ChangeUserRoleResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsersByRole: builder.query<UserListResponse, string>({
      query: (role) => `/user/list?role=${role}`,
      providesTags: ["User"],
      transformResponse: (response: UserListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getUsers: builder.query<UserListResponse, UserFilters>({
      query: (filters = {}) => {
        const { page = 1, page_size = 10, keyword = "", role = "" } = filters;
        let url = `/user/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        if (role) {
          const roleParam = role === "Lead IQA" ? "LIQA" : role;
          url += `&role=${encodeURIComponent(roleParam)}`;
        }
        return url;
      },
      providesTags: ["User"],
      transformResponse: (response: UserListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createUser: builder.mutation<UserResponse, CreateUserRequest>({
      query: (body) => ({
        url: "/user/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
      transformResponse: (response: UserResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateUser: builder.mutation<UserResponse, { id: number; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/user/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["User"],
      transformResponse: (response: UserResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteUser: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/user/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    changeUserRole: builder.mutation<ChangeUserRoleResponse, ChangeUserRoleRequest>({
      query: (body) => ({
        url: "/user/changerole/",
        method: "POST",
        body,
      }),
      transformResponse: (response: ChangeUserRoleResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetUsersByRoleQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useChangeUserRoleMutation,
} = userApi;

