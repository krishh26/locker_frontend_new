import { AuthUser, LoginResult } from "./types"

export const DEFAULT_ERROR_MESSAGE =
  "Unable to sign in with the provided credentials."

export const TOKEN_COOKIE_KEY = "locker.token"
export const USER_COOKIE_KEY = "locker.user"

export type LoginSuccessPayload = {
  accessToken: string
  password_changed?: boolean
  [key: string]: unknown
}

export type LoginResponseEnvelope = {
  status: boolean
  data?: LoginSuccessPayload
  error?: string
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")

  if (parts.length !== 3) {
    return null
  }

  try {
    const payload = parts[1]
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded =
      normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
    const decode =
      typeof atob === "function"
        ? atob
        : typeof window !== "undefined" && typeof window.atob === "function"
          ? window.atob.bind(window)
          : undefined

    if (!decode) {
      return null
    }

    const decoded = decode(padded)

    return JSON.parse(
      decodeURIComponent(
        decoded
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      ),
    )
  } catch {
    return null
  }
}

export function buildUser(data: Record<string, unknown>): AuthUser {
  if (!data) {
    return {}
  }

  const user =
    (data.user as Record<string, unknown> | undefined) ??
    (data.decoded as Record<string, unknown> | undefined) ??
    data

  // Extract assignedOrganisationIds from assignedOrganisationIds or assigned_organisations
  let assignedOrgIds: number[] | null = null;
  if (user.assignedOrganisationIds) {
    assignedOrgIds = user.assignedOrganisationIds as number[] | null;
  } else if (user.assigned_organisations) {
    // Extract IDs from assigned_organisations array
    const orgs = user.assigned_organisations as Array<{ id: number; [key: string]: unknown }> | undefined;
    if (Array.isArray(orgs) && orgs.length > 0) {
      assignedOrgIds = orgs.map(org => org.id);
    }
  }

  const tokenUser: AuthUser = {
    id: (user.id as string | undefined) ?? (user.user_id as string | undefined),
    email: user.email as string | undefined,
    firstName:
      (user.first_name as string | undefined) ??
      (user.firstName as string | undefined),
    lastName:
      (user.last_name as string | undefined) ??
      (user.lastName as string | undefined),
    role: user.role as string | undefined,
    roles: user.roles as string[] | undefined,
    learner_id: (user.learner_id as number | undefined) ?? (user.learner_id as string | undefined),
    assignedOrganisationIds: assignedOrgIds,
  }

  return {
    ...user,
    ...tokenUser,
  } as AuthUser
}

export function toLoginResult(payload: LoginSuccessPayload): LoginResult {
  if (!payload?.accessToken) {
    throw new Error("Missing access token in response.")
  }

  const decoded = decodeJwtPayload(payload.accessToken)
  const user = buildUser({
    ...payload,
    decoded,
  })

  return {
    token: payload.accessToken,
    passwordChanged: payload.password_changed ?? true,
    user,
    raw: payload,
  }
}

