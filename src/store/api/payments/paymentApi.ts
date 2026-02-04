import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  PaymentListResponse,
  PaymentResponse,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export interface PaymentFilters {
  organisationId?: number
  status?: "draft" | "sent" | "failed" | "refunded"
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery,
  tagTypes: ["Payment"],
  endpoints: (builder) => ({
    getPayments: builder.query<PaymentListResponse, PaymentFilters | void>({
      query: (filters = {}) => {
        const {
          organisationId,
          status = "",
          dateFrom = "",
          dateTo = "",
          page = 1,
          limit = 10,
        } = filters as PaymentFilters
        let url = `/payments?page=${page}&limit=${limit}`
        if (organisationId) {
          url += `&organisationId=${organisationId}`
        }
        if (status) {
          url += `&status=${encodeURIComponent(status)}`
        }
        if (dateFrom) {
          url += `&dateFrom=${encodeURIComponent(dateFrom)}`
        }
        if (dateTo) {
          url += `&dateTo=${encodeURIComponent(dateTo)}`
        }
        return url
      },
      providesTags: ["Payment"],
      transformResponse: (response: PaymentListResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    getPayment: builder.query<PaymentResponse, number>({
      query: (id) => `/payments/${id}`,
      providesTags: ["Payment"],
      transformResponse: (response: PaymentResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    createPayment: builder.mutation<PaymentResponse, CreatePaymentRequest>({
      query: (body) => ({
        url: "/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Payment"],
      transformResponse: (response: PaymentResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
    updatePayment: builder.mutation<
      PaymentResponse,
      { id: number; data: UpdatePaymentRequest }
    >({
      query: ({ id, data }) => ({
        url: `/payments/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Payment"],
      transformResponse: (response: PaymentResponse) => {
        if (!response?.status) {
          throw new Error(response?.message ?? DEFAULT_ERROR_MESSAGE)
        }
        return response
      },
    }),
  }),
})

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} = paymentApi
