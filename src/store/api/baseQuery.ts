import { fetchBaseQuery, BaseQueryFn } from "@reduxjs/toolkit/query/react"
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"

import { clearCredentials } from "@/store/slices/authSlice"
import type { RootState } from "@/store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/**
 * Centralized baseQuery for all RTK Query APIs
 * - Validates API_BASE_URL before making requests
 * - Adds Authorization header with Bearer token
 * - Handles 401/403 responses by clearing credentials (logout)
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Check if API_BASE_URL is configured
  if (!API_BASE_URL || API_BASE_URL.trim() === "") {
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        data: "Sorry, the server address is not set. Please contact the administrator or try again later.",
      } as FetchBaseQueryError,
    }
  }

  // Create base query with auth headers
  const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState
      const token = state.auth?.token
      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      }
      headers.set('ngrok-skip-browser-warning', 'true')
      return headers
    },
  })

  // Execute the query
  const result = await baseQueryWithAuth(args, api, extraOptions)

  // Handle 401 (Unauthorized) and 403 (Forbidden) responses
  if (result.error) {
    const status = result.error.status
    if (status === 401 || status === 403) {
      // Clear credentials (logout) on authentication failure
      api.dispatch(clearCredentials())
      window.location.href = "/"
    }
  }

  return result
}
