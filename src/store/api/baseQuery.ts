import { fetchBaseQuery, BaseQueryFn } from "@reduxjs/toolkit/query/react"
import type { FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query"

import { clearCredentials } from "@/store/slices/authSlice"
import type { RootState } from "@/store"
import { isMasterAdmin } from "@/utils/permissions"
import { AuthUser } from "../api/auth/types"

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
      // MasterAdmin / OrgAdmin org mode:
      // - MasterAdmin: use orgContext.masterAdminOrganisationId when "viewing as" one org
      // - OrganisationAdmin: always send their single assigned organisation id
      const user = state.auth?.user
      const orgContextOrgId = state.orgContext?.masterAdminOrganisationId

      let organisationIdToSend: number | null = null

      // 1) MasterAdmin → respect selected org context (global vs specific org)
      if (
        user &&
        isMasterAdmin(user) &&
        orgContextOrgId != null &&
        !Number.isNaN(Number(orgContextOrgId))
      ) {
        organisationIdToSend = Number(orgContextOrgId)
      }

      // 2) Org Admin → always send their single assigned org
      if (
        !organisationIdToSend && 
        user &&
        Array.isArray((user as AuthUser)["assignedOrganisationIds"] ?? []) &&
        (user as AuthUser)["assignedOrganisationIds"]?.length === 1
      ) {
        organisationIdToSend = Number((user as AuthUser)["assignedOrganisationIds"]?.[0])
      }

      if (organisationIdToSend != null && !Number.isNaN(organisationIdToSend)) {
        headers.set("X-Organisation-Id", String(organisationIdToSend))
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
