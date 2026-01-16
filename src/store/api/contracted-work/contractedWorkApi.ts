import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ContractedWorkListResponse,
  ContractedWorkResponse,
  CreateContractedWorkRequest,
  UpdateContractedWorkRequest,
} from "./types";
import { DEFAULT_ERROR_MESSAGE } from "../auth/api";
import { baseQuery } from "@/store/api/baseQuery";

export const contractedWorkApi = createApi({
  reducerPath: "contractedWorkApi",
  baseQuery,
  tagTypes: ["ContractedWork"],
  endpoints: (builder) => ({
    getContractedWorkByLearner: builder.query<ContractedWorkListResponse, number>({
      query: (learnerId) => `/contractwork/list?learner_id=${learnerId}`,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({
                type: "ContractedWork" as const,
                id,
              })),
              { type: "ContractedWork", id: "LIST" },
            ]
          : [{ type: "ContractedWork", id: "LIST" }],
      transformResponse: (response: ContractedWorkListResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    createContractedWork: builder.mutation<
      ContractedWorkResponse,
      CreateContractedWorkRequest
    >({
      query: (body) => ({
        url: "/contractwork/create",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ContractedWork", id: "LIST" }],
      transformResponse: (response: ContractedWorkResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    updateContractedWork: builder.mutation<
      ContractedWorkResponse,
      { id: number; data: UpdateContractedWorkRequest }
    >({
      query: ({ id, data }) => ({
        url: `/contractwork/update/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "ContractedWork", id: arg.id },
        { type: "ContractedWork", id: "LIST" },
      ],
      transformResponse: (response: ContractedWorkResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE);
        }
        return response;
      },
    }),
    deleteContractedWork: builder.mutation<
      { status: boolean; message?: string; error?: string },
      number
    >({
      query: (id) => ({
        url: `/contractwork/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "ContractedWork", id },
        { type: "ContractedWork", id: "LIST" },
      ],
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
  }),
});

export const {
  useGetContractedWorkByLearnerQuery,
  useCreateContractedWorkMutation,
  useUpdateContractedWorkMutation,
  useDeleteContractedWorkMutation,
} = contractedWorkApi;

