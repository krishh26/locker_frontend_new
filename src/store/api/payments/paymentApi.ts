import { createApi } from "@reduxjs/toolkit/query/react"
import type {
  PaymentListResponse,
  PaymentResponse,
} from "./types"
import { DEFAULT_ERROR_MESSAGE } from "../auth/api"
import { baseQuery } from "@/store/api/baseQuery"

export interface PaymentFilters {
  organisationId?: number
  status?: "completed" | "pending" | "failed" | "refunded"
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
  }),
})

export const {
  useGetPaymentsQuery,
  useGetPaymentQuery,
} = paymentApi
