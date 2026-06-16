import { decodeJwtPayload } from "@/store/api/auth/api"

/**
 * Resolves the active session role for middleware / server checks.
 * JWT is preferred because it is refreshed on change-role; user cookie can lag behind.
 */
export function getRoleFromAccessToken(token: string | undefined | null): string | null {
  if (!token) return null

  const decoded = decodeJwtPayload(token)
  const role = decoded?.role
  return typeof role === "string" && role.trim() ? role : null
}

export function getRoleFromUserCookie(
  userCookie: string | undefined | null,
): string | null {
  if (!userCookie) return null

  try {
    const parsed = JSON.parse(userCookie) as { role?: unknown }
    return typeof parsed?.role === "string" && parsed.role.trim()
      ? parsed.role
      : null
  } catch {
    return null
  }
}

export function resolveSessionRole(
  token: string | undefined | null,
  userCookie: string | undefined | null,
): string | null {
  return getRoleFromAccessToken(token) ?? getRoleFromUserCookie(userCookie)
}
