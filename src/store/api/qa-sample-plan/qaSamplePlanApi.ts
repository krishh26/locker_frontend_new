import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  SamplePlanResponse,
  SamplePlanQueryParams,
  SamplePlanLearnersResponse,
  PlanDetailsResponse,
  ApplySamplePlanLearnersRequest,
  UpdateSamplePlanDetailRequest,
  SampleActionsResponse,
  CreateSampleActionRequest,
  UpdateSampleActionRequest,
  SampleDocumentsResponse,
  SampleFormsResponse,
  CreateSampleFormRequest,
  SampleQuestionsResponse,
  CreateSampleQuestionsRequest,
  UpdateSampleQuestionRequest,
  EvidenceListResponse,
  AddAssignmentReviewRequest,
  DeleteAssignmentReviewFileRequest,
  UpdateMappedSubUnitSignOffRequest,
  UnitMappingResponse,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const qaSamplePlanApi = createApi({
  reducerPath: "qaSamplePlanApi",
  baseQuery,
  tagTypes: ["SamplePlan", "SamplePlanLearner", "SamplePlanDetail", "SampleAction", "SampleDocument", "SampleForm", "SampleQuestion"],
  endpoints: (builder) => ({
    getSamplePlans: builder.query<SamplePlanResponse, SamplePlanQueryParams>({
      query: (params) => {
        const filteredParams = Object.fromEntries(
          Object.entries(params).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
          )
        );
        const searchParams = new URLSearchParams();
        Object.entries(filteredParams).forEach(([key, value]) => {
          searchParams.append(key, String(value));
        });
        return `/sample-plan/list?${searchParams.toString()}`;
      },
      providesTags: ["SamplePlan"],
      transformResponse: (response: SamplePlanResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getSamplePlanLearners: builder.query<SamplePlanLearnersResponse, string | number>({
      query: (planId) => {
        const encodedId = encodeURIComponent(String(planId));
        return `/sample-plan/${encodedId}/learners`;
      },
      providesTags: ["SamplePlanLearner"],
      transformResponse: (response: SamplePlanLearnersResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getPlanDetails: builder.query<PlanDetailsResponse, string | number>({
      query: (planId) => {
        const encodedId = encodeURIComponent(String(planId));
        return `/sample-plan/${encodedId}/details`;
      },
      providesTags: ["SamplePlanDetail"],
      transformResponse: (response: PlanDetailsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    applySamplePlanLearners: builder.mutation<SamplePlanLearnersResponse, ApplySamplePlanLearnersRequest>({
      query: (body) => ({
        url: "/sample-plan/add-sampled-learners",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SamplePlanLearner", "SamplePlan"],
      transformResponse: (response: SamplePlanLearnersResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSamplePlanDetail: builder.mutation<SamplePlanLearnersResponse, UpdateSamplePlanDetailRequest>({
      query: ({ plan_id, ...body }) => {
        const encodedId = encodeURIComponent(String(plan_id));
        return {
          url: `/sample-plan/deatil/${encodedId}`,
          method: "PATCH",
          body,
        };
      },
      invalidatesTags: ["SamplePlanDetail", "SamplePlanLearner"],
      transformResponse: (response: SamplePlanLearnersResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    removeSampledLearner: builder.mutation<{ status: boolean; message?: string; error?: string }, string | number>({
      query: (detailId) => {
        const encodedId = encodeURIComponent(String(detailId));
        return {
          url: `/sample-plan/remove-sampled-learner/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SamplePlanLearner", "SamplePlanDetail"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // Sample Questions endpoints
    getSampleQuestions: builder.query<SampleQuestionsResponse, string | number>({
      query: (planDetailId) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        return `/sample-question/list/${encodedId}`;
      },
      providesTags: ["SampleQuestion"],
      transformResponse: (response: SampleQuestionsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createSampleQuestions: builder.mutation<SampleQuestionsResponse, CreateSampleQuestionsRequest>({
      query: (body) => ({
        url: "/sample-question/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleQuestion"],
      transformResponse: (response: SampleQuestionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSampleQuestion: builder.mutation<SampleQuestionsResponse, UpdateSampleQuestionRequest>({
      query: ({ id, ...body }) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sample-question/update/${encodedId}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["SampleQuestion"],
      transformResponse: (response: SampleQuestionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSampleQuestion: builder.mutation<{ status: boolean; message?: string; error?: string }, string | number>({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sample-question/delete/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SampleQuestion"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // Sample Actions endpoints
    getSampleActions: builder.query<SampleActionsResponse, string | number>({
      query: (planDetailId) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        return `/sample-action/list/${encodedId}`;
      },
      providesTags: ["SampleAction"],
      transformResponse: (response: SampleActionsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createSampleAction: builder.mutation<SampleActionsResponse, CreateSampleActionRequest>({
      query: (body) => ({
        url: "/sample-action/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleAction"],
      transformResponse: (response: SampleActionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateSampleAction: builder.mutation<SampleActionsResponse, UpdateSampleActionRequest>({
      query: ({ actionId, ...body }) => {
        const encodedId = encodeURIComponent(String(actionId));
        return {
          url: `/sample-action/update/${encodedId}`,
          method: "PATCH",
          body,
        };
      },
      invalidatesTags: ["SampleAction"],
      transformResponse: (response: SampleActionsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSampleAction: builder.mutation<{ status: boolean; message?: string; error?: string }, string | number>({
      query: (actionId) => {
        const encodedId = encodeURIComponent(String(actionId));
        return {
          url: `/sample-action/delete/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SampleAction"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // Sample Documents endpoints
    getSampleDocuments: builder.query<SampleDocumentsResponse, string | number>({
      query: (planDetailId) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        return `/sample-doc/list/${encodedId}`;
      },
      providesTags: ["SampleDocument"],
      transformResponse: (response: SampleDocumentsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    uploadSampleDocument: builder.mutation<SampleDocumentsResponse, FormData>({
      query: (formData) => ({
        url: "/sample-doc/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["SampleDocument"],
      transformResponse: (response: SampleDocumentsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSampleDocument: builder.mutation<{ status: boolean; message?: string; error?: string }, string | number>({
      query: (docId) => {
        const encodedId = encodeURIComponent(String(docId));
        return {
          url: `/sample-doc/delete/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SampleDocument"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // Sample Forms endpoints
    getSampleForms: builder.query<SampleFormsResponse, string | number>({
      query: (planDetailId) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        return `/sample-form/list/${encodedId}`;
      },
      providesTags: ["SampleForm"],
      transformResponse: (response: SampleFormsResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createSampleForm: builder.mutation<SampleFormsResponse, CreateSampleFormRequest>({
      query: (body) => ({
        url: "/sample-form/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SampleForm"],
      transformResponse: (response: SampleFormsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteSampleForm: builder.mutation<{ status: boolean; message?: string; error?: string }, string | number>({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sample-form/delete/${encodedId}`,
          method: "DELETE",
        };
      },
      invalidatesTags: ["SampleForm"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    completeSampleForm: builder.mutation<SampleFormsResponse, string | number>({
      query: (id) => {
        const encodedId = encodeURIComponent(String(id));
        return {
          url: `/sample-form/complete/${encodedId}`,
          method: "PUT",
        };
      },
      invalidatesTags: ["SampleForm"],
      transformResponse: (response: SampleFormsResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    // Evidence endpoints
    getEvidenceList: builder.query<EvidenceListResponse, { planDetailId: string | number; unitCode: string }>({
      query: ({ planDetailId, unitCode }) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        const params = new URLSearchParams();
        if (unitCode) {
          params.append("unit_code", unitCode);
        }
        return `/sample-plan/${encodedId}/evidence${params.toString() ? `?${params.toString()}` : ""}`;
      },
      providesTags: ["SamplePlanDetail"],
      transformResponse: (response: EvidenceListResponse) => {
        if (response.status === false) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    addAssignmentReview: builder.mutation<{ status: boolean; message?: string; error?: string }, AddAssignmentReviewRequest>({
      query: (body) => {
        const formData = new FormData();
        formData.append("mapping_id", String(body.mapping_id));
        formData.append("sampling_plan_detail_id", String(body.sampling_plan_detail_id));
        formData.append("role", body.role);
        formData.append("comment", body.comment);
        formData.append("unit_code", body.unit_code);
        if (body.completed !== undefined) {
          formData.append("completed", String(body.completed));
        }
        if (body.file) {
          formData.append("file", body.file);
        }
        return {
          url: "/sample-plan/assignment-review",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["SamplePlanDetail"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteAssignmentReviewFile: builder.mutation<{ status: boolean; message?: string; error?: string }, DeleteAssignmentReviewFileRequest>({
      query: (body) => ({
        url: "/sample-plan/assignment-review/file",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["SamplePlanDetail"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateMappedSubUnitSignOff: builder.mutation<{ status: boolean; message?: string; error?: string }, UpdateMappedSubUnitSignOffRequest>({
      query: (body) => ({
        url: "/sample-plan/assignment-pc-review",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SamplePlanDetail"],
      transformResponse: (response: { status: boolean; message?: string; error?: string }) => {
        if (!response?.status) {
          throw new Error(response?.error ?? response?.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    getUnitMappingByType: builder.query<UnitMappingResponse, { planDetailId: string | number }>({
      query: ({ planDetailId }) => {
        const encodedId = encodeURIComponent(String(planDetailId));
        return `/sample-plan/${encodedId}/unit-mapping`;
      },
      providesTags: ["SamplePlanDetail"],
      transformResponse: (response: UnitMappingResponse) => {
        if (!response?.status) {
          throw new Error(response.error ?? response.message ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
  }),
});

export const {
  useGetSamplePlansQuery,
  useLazyGetSamplePlanLearnersQuery,
  useLazyGetPlanDetailsQuery,
  useApplySamplePlanLearnersMutation,
  useUpdateSamplePlanDetailMutation,
  useRemoveSampledLearnerMutation,
  useGetSampleQuestionsQuery,
  useLazyGetSampleQuestionsQuery,
  useCreateSampleQuestionsMutation,
  useUpdateSampleQuestionMutation,
  useDeleteSampleQuestionMutation,
  useGetSampleActionsQuery,
  useLazyGetSampleActionsQuery,
  useCreateSampleActionMutation,
  useUpdateSampleActionMutation,
  useDeleteSampleActionMutation,
  useGetSampleDocumentsQuery,
  useLazyGetSampleDocumentsQuery,
  useUploadSampleDocumentMutation,
  useDeleteSampleDocumentMutation,
  useGetSampleFormsQuery,
  useLazyGetSampleFormsQuery,
  useCreateSampleFormMutation,
  useDeleteSampleFormMutation,
  useCompleteSampleFormMutation,
  useGetEvidenceListQuery,
  useLazyGetEvidenceListQuery,
  useAddAssignmentReviewMutation,
  useDeleteAssignmentReviewFileMutation,
  useUpdateMappedSubUnitSignOffMutation,
  useGetUnitMappingByTypeQuery,
  useLazyGetUnitMappingByTypeQuery,
} = qaSamplePlanApi;

