import { fetchBaseQuery, BaseQueryFn } from "@reduxjs/toolkit/query/react"
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"

import { clearCredentials } from "@/store/slices/authSlice"
import type { RootState } from "@/store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

/**
 * Centralized baseQuery for all RTK Query APIs
 * - Validates API_BASE_URL before making requests
 * - Adds Authorization header with Bearer token
 * - Handles 401 responses by clearing credentials (logout)
 * - 403 responses are passed through so components can show "Access Denied"
 */
export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  if (!API_BASE_URL || API_BASE_URL.trim() === "") {
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        data: "Sorry, the server address is not set. Please contact the administrator or try again later.",
      } as FetchBaseQueryError,
    }
  }

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

  const result = await baseQueryWithAuth(args, api, extraOptions)

  if (result.error) {
    const status = result.error.status
    if (status === 401) {
      api.dispatch(clearCredentials())
      window.location.href = "/"
    }
    // 403 is NOT auto-logout; centre/org scoped users get 403 when accessing
    // resources outside their scope. Components handle this with AccessDenied UI.
  }

  return result
}

/** Type guard to check if an RTK Query error is a 403 Forbidden response */
export function isForbiddenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  return (error as FetchBaseQueryError).status === 403
}
