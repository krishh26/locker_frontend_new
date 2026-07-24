import {
  filterRolesFromApi,
  getHighestPriorityRole,
  normalizeRole,
  type Role,
} from "@/config/auth-roles"

/**
 * Picks the active role for the session: current Redux/cookie selection first,
 * then API role, then highest-priority allowed role.
 */
export function resolveActiveUserRole(
  roles: string[] | null | undefined,
  options?: {
    apiRole?: unknown
    currentRole?: unknown
  },
): Role | undefined {
  const filtered = filterRolesFromApi(roles)
  if (filtered.length === 0) {
    return undefined
  }

  for (const raw of [options?.currentRole, options?.apiRole]) {
    const normalized = normalizeRole(raw)
    if (normalized && filtered.includes(normalized)) {
      return normalized
    }
  }

  return getHighestPriorityRole(filtered)
}
