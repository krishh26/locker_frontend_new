import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SubmittedFormsResponse,
  LockFormRequest,
  UnlockFormRequest,
  LockFormResponse,
  UnlockFormResponse,
  FormListResponse,
  DeleteFormRequest,
  DeleteFormResponse,
  AssignUsersRequest,
  AssignUsersResponse,
  UsersListResponse,
  FormDetailsResponse,
  FormDataDetailsResponse,
  SubmitFormRequest,
  SubmitFormResponse,
  CreateFormRequest,
  UpdateFormRequest,
  FormDetailsResponse as CreateFormResponse,
  FormTemplateListResponse,
  FormTemplateResponse,
  CreateFormTemplateRequest,
  DeleteFormTemplateRequest,
  DeleteFormTemplateResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const formsApi = createApi({
  reducerPath: "formsApi",
  baseQuery,
  tagTypes: ["SubmittedForm", "Form", "FormTemplate"],
  endpoints: (builder) => ({
    getAllSubmittedForms: builder.query<
      SubmittedFormsResponse,
      { page?: number; page_size?: number; search_keyword?: string }
    >({
      query: ({ page = 1, page_size = 10, search_keyword = "" }) => {
        let url = `/form/list/user?meta=true&page=${page}&limit=${page_size}`;
        if (search_keyword) {
          url = `${url}&keyword=${search_keyword}`;
        }
        return url;
      },
      providesTags: ["SubmittedForm"],
      transformResponse: (response: SubmittedFormsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    lockForm: builder.mutation<LockFormResponse, LockFormRequest>({
      query: ({ formId, userId, reason }) => ({
        url: `/form/${formId}/users/${userId}/lock`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["SubmittedForm"],
      transformResponse: (response: LockFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    unlockForm: builder.mutation<UnlockFormResponse, UnlockFormRequest>({
      query: ({ formId, userId, reason }) => ({
        url: `/form/${formId}/users/${userId}/unlock`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["SubmittedForm"],
      transformResponse: (response: UnlockFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getFormsList: builder.query<
      FormListResponse,
      { page?: number; page_size?: number; search_keyword?: string; user_id?: string | number }
    >({
      query: ({ page = 1, page_size = 10, search_keyword = "", user_id }) => {
        let url = `/form/list?meta=true&page=${page}&limit=${page_size}`;
        if (search_keyword) {
          url = `${url}&keyword=${search_keyword}`;
        }
        if (user_id) {
          url = `${url}&user_id=${user_id}`;
        }
        return url;
      },
      providesTags: ["Form"],
      transformResponse: (response: FormListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteForm: builder.mutation<DeleteFormResponse, DeleteFormRequest>({
      query: ({ formId }) => ({
        url: `/form/delete/${formId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Form"],
      transformResponse: (response: DeleteFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    assignUsersToForm: builder.mutation<AssignUsersResponse, AssignUsersRequest>({
      query: ({ formId, user_ids, assign }) => ({
        url: `/form/${formId}/assign-users`,
        method: "POST",
        body: user_ids ? { user_ids } : { assign },
      }),
      invalidatesTags: ["Form"],
      transformResponse: (response: AssignUsersResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getAllUsers: builder.query<UsersListResponse, void>({
      query: () => `/user/list`,
      transformResponse: (response: UsersListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getFormDetails: builder.query<FormDetailsResponse, string | number>({
      query: (formId) => `/form/get/${formId}`,
      providesTags: ["Form"],
      transformResponse: (response: FormDetailsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getFormDataDetails: builder.query<
      FormDataDetailsResponse,
      { formId: string | number; userId: string | number }
    >({
      query: ({ formId, userId }) => `/form/user/${formId}?user_id=${userId}`,
      transformResponse: (response: FormDataDetailsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    submitForm: builder.mutation<SubmitFormResponse, SubmitFormRequest>({
      query: ({ formData }) => {
        const url = `/form/user/create`;
        // Always use FormData
        return {
          url,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Form", "SubmittedForm"],
      transformResponse: (response: SubmitFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createForm: builder.mutation<CreateFormResponse, CreateFormRequest>({
      query: (body) => ({
        url: "/form/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Form"],
      transformResponse: (response: CreateFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateForm: builder.mutation<CreateFormResponse, { id: string | number; data: UpdateFormRequest }>({
      query: ({ id, data }) => ({
        url: `/form/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Form"],
      transformResponse: (response: CreateFormResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getFormTemplates: builder.query<FormTemplateListResponse, void>({
      query: () => `/form/templates`,
      providesTags: ["FormTemplate"],
      transformResponse: (response: FormTemplateListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getFormTemplateList: builder.query<
      FormTemplateListResponse,
      { page?: number; page_size?: number; keyword?: string }
    >({
      query: ({ page = 1, page_size = 10, keyword = "" }) => {
        let url = `/form-template/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        return {
          url,
          method: "GET",
        };
      },
      providesTags: ["FormTemplate"],
      transformResponse: (response: FormTemplateListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createFormTemplate: builder.mutation<FormTemplateResponse, CreateFormTemplateRequest>({
      query: (body) => ({
        url: "/form/template/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["FormTemplate"],
      transformResponse: (response: FormTemplateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteFormTemplate: builder.mutation<DeleteFormTemplateResponse, DeleteFormTemplateRequest>({
      query: ({ templateId }) => ({
        url: `/form/template/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FormTemplate"],
      transformResponse: (response: DeleteFormTemplateResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetAllSubmittedFormsQuery,
  useLockFormMutation,
  useUnlockFormMutation,
  useGetFormsListQuery,
  useDeleteFormMutation,
  useAssignUsersToFormMutation,
  useGetAllUsersQuery,
  useGetFormDetailsQuery,
  useGetFormDataDetailsQuery,
  useSubmitFormMutation,
  useCreateFormMutation,
  useUpdateFormMutation,
  useGetFormTemplatesQuery,
  useGetFormTemplateListQuery,
  useCreateFormTemplateMutation,
  useDeleteFormTemplateMutation,
} = formsApi;

