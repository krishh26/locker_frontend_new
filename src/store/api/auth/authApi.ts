import { createApi } from "@reduxjs/toolkit/query/react"

import {
  DEFAULT_ERROR_MESSAGE,
  LoginResponseEnvelope,
  toLoginResult,
} from "@/store/api/auth/api"
import type {
  ApiResponse,
  ForgotPasswordRequest,
  LoginCredentials,
  LoginResult,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/store/api/auth/types"
import { baseQuery } from "@/store/api/baseQuery"

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResult, LoginCredentials>({
      query: (credentials) => ({
        url: "/user/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: LoginResponseEnvelope) => {
        if (!response?.status || !response?.data) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE)
        }

        return toLoginResult(response.data)
      },
    }),
    sendForgotPasswordOtp: builder.mutation<ApiResponse, ForgotPasswordRequest>({
      query: (payload) => ({
        url: "/otp/sendotp",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE)
        }

        return response
      },
    }),
    verifyForgotPasswordOtp: builder.mutation<ApiResponse, VerifyOtpRequest>({
      query: (payload) => ({
        url: "/otp/validateotp",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE)
        }

        return response
      },
    }),
    resetPassword: builder.mutation<ApiResponse, ResetPasswordRequest>({
      query: (payload) => ({
        url: "/user/updatepassword",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse) => {
        if (!response?.status) {
          throw new Error(response?.error ?? DEFAULT_ERROR_MESSAGE)
        }

        return response
      },
    }),
  }),
})

export const {
  useLoginMutation,
  useSendForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
} = authApi

