import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  LearnerResponse,
  LearnerListResponse,
  LearnerFilters,
  CreateLearnerRequest,
  UpdateLearnerRequest,
  UpdateLearnerCommentRequest,
  BulkCreateLearnersRequest,
  BulkCreateLearnersResponse,
  UploadFileResponse,
  CreateUserCourseRequest,
  UpdateUserCourseRequest,
  UserCourseResponse,
  AssignEqaToCourseRequest,
  AssignEqaToCourseResponse,
  AssignedLearnerResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const learnerApi = createApi({
  reducerPath: "learnerApi",
  baseQuery,
  tagTypes: ["Learner"],
  endpoints: (builder) => ({
    getLearnerDetails: builder.query<LearnerResponse, number>({
      query: (learnerId) => `/learner/get/${learnerId}`,
      providesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnersList: builder.query<LearnerListResponse, LearnerFilters>({
      query: (filters = {}) => {
        const {
          page = 1,
          page_size = 10,
          keyword = "",
          course_id = "",
          employer_id = "",
          employer_ids = "",
          status = "",
          user_id = "",
          role = "",
        } = filters;
        let url = `/learner/list?page=${page}&limit=${page_size}&meta=true`;
        if (keyword) {
          url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        if (course_id) {
          url += `&course_id=${encodeURIComponent(course_id)}`;
        }
        if (employer_id) {
          url += `&employer_id=${encodeURIComponent(employer_id)}`;
        }
        if (status) {
          url += `&status=${encodeURIComponent(status)}`;
        }
        if (user_id) {
          url += `&user_id=${encodeURIComponent(user_id)}`;
        }
        if (role) {
          url += `&role=${encodeURIComponent(role)}`;
        }
        if (employer_ids) {
          url += `&employer_ids=${encodeURIComponent(employer_ids)}`;
        }
        return url;
      },
      providesTags: ["Learner"],
      transformResponse: (response: LearnerListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createLearner: builder.mutation<LearnerResponse, CreateLearnerRequest>({
      query: (body) => ({
        url: "/learner/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateLearner: builder.mutation<LearnerResponse, { id: number; data: UpdateLearnerRequest }>({
      query: ({ id, data }) => ({
        url: `/learner/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteLearner: builder.mutation<{ message: string; status: boolean }, number>({
      query: (id) => ({
        url: `/learner/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: { message: string; status: boolean }) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateLearnerComment: builder.mutation<LearnerResponse, { id: number; data: UpdateLearnerCommentRequest }>({
      query: ({ id, data }) => ({
        url: `/learner/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: LearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    bulkCreateLearners: builder.mutation<BulkCreateLearnersResponse, BulkCreateLearnersRequest>({
      query: (body) => ({
        url: "/learner/bulk-upload",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: BulkCreateLearnersResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getLearnersByUser: builder.query<LearnerListResponse, { user_id: number; role: string }>({
      query: ({ user_id, role }) => `/learner/list?user_id=${user_id}&role=${role}`,
      providesTags: ["Learner"],
      transformResponse: (response: LearnerListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    uploadLearnerAvatar: builder.mutation<UploadFileResponse, { learnerId: number; file: File }>({
      query: ({ learnerId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "learner");
        return {
          url: `/learner/upload-avatar/${learnerId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: (result, error, arg) => [
        { type: "Learner", id: arg.learnerId },
        "Learner",
      ],
      transformResponse: (response: UploadFileResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createUserCourse: builder.mutation<UserCourseResponse, CreateUserCourseRequest>({
      query: (body) => ({
        url: "/course/enrollment",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Learner", id: arg.learner_id },
        "Learner",
      ],
      transformResponse: (response: UserCourseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateUserCourse: builder.mutation<
      UserCourseResponse,
      { userCourseId: number; data: UpdateUserCourseRequest }
    >({
      query: ({ userCourseId, data }) => ({
        url: `/course/user/update/${userCourseId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: UserCourseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteUserCourse: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (userCourseId) => ({
        url: `/course/delete/${userCourseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: {
        status: boolean;
        message?: string;
        error?: string;
      }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    assignEqaToCourse: builder.mutation<
      AssignEqaToCourseResponse,
      AssignEqaToCourseRequest
    >({
      query: (body) => ({
        url: "/course/user/assign-eqa",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learner"],
      transformResponse: (response: AssignEqaToCourseResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getEqaAssignedLearners: builder.query<
      AssignedLearnerResponse,
      { eqaId: number; page?: number; page_size?: number; meta?: boolean }
    >({
      query: ({ eqaId, page = 1, page_size = 10, meta = true }) => {
        let url = `/course/eqa/${eqaId}/assigned-learners?page=${page}&limit=${page_size}`;
        if (meta) {
          url += `&meta=true`;
        }
        return url;
      },
      providesTags: ["Learner"],
      transformResponse: (response: AssignedLearnerResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetLearnerDetailsQuery,
  useLazyGetLearnerDetailsQuery,
  useGetLearnersListQuery,
  useCreateLearnerMutation,
  useUpdateLearnerMutation,
  useDeleteLearnerMutation,
  useUpdateLearnerCommentMutation,
  useBulkCreateLearnersMutation,
  useGetLearnersByUserQuery,
  useUploadLearnerAvatarMutation,
  useCreateUserCourseMutation,
  useUpdateUserCourseMutation,
  useDeleteUserCourseMutation,
  useAssignEqaToCourseMutation,
  useGetEqaAssignedLearnersQuery,
} = learnerApi;

