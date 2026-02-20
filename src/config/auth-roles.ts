const baseRoles = [
  "Admin",
  "Learner",
  "Trainer",
  "Employer",
  "LIQA",
  "IQA",
  "EQA",
  "MasterAdmin",
  "AccountManager",
] as const

/** Roles returned by API that we strip from auth/display (not used in app) */
export const ROLES_STRIPPED_FROM_API = ["CentreAdmin", "OrganisationAdmin"] as const

export type Role = (typeof baseRoles)[number]

/**
 * Filter out CentreAdmin and OrganisationAdmin from role arrays (e.g. from API).
 * Use when setting user.roles or displaying roles so these two are never shown or used.
 */
export function filterRolesFromApi(roles: string[] | null | undefined): string[] {
  if (!Array.isArray(roles) || roles.length === 0) return []
  return roles.filter(
    (r) => !ROLES_STRIPPED_FROM_API.includes(r as (typeof ROLES_STRIPPED_FROM_API)[number])
  )
}

export const authRoles = {
  Admin: ["Admin"] as const satisfies readonly Role[],
  Learner: ["Learner"] as const satisfies readonly Role[],
  Trainer: ["Trainer"] as const satisfies readonly Role[],
  Employer: ["Employer"] as const satisfies readonly Role[],
  LIQA: ["LIQA"] as const satisfies readonly Role[],
  IQA: ["IQA"] as const satisfies readonly Role[],
  EQA: ["EQA"] as const satisfies readonly Role[],
  MasterAdmin: ["MasterAdmin"] as const satisfies readonly Role[],
  AccountManager: ["AccountManager"] as const satisfies readonly Role[],
  all: [...baseRoles] as const satisfies readonly Role[],
  onlyGuest: null,
  // Role groups for Master Admin and Account Manager
  masterAdminOnly: ["MasterAdmin"] as const satisfies readonly Role[],
  masterAdminAndAccountManager: ["MasterAdmin", "AccountManager"] as const satisfies readonly Role[],
} as const

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") {
    return null
  }
  if (ROLES_STRIPPED_FROM_API.includes(role as (typeof ROLES_STRIPPED_FROM_API)[number])) {
    return null
  }
  return (baseRoles as readonly string[]).includes(role)
    ? (role as Role)
    : null
}

export function isRoleAllowed(
  role: unknown,
  allowedRoles: readonly Role[] | null | undefined,
): boolean {
  if (allowedRoles === null) {
    return normalizeRole(role) === null
  }

  const normalizedRole = normalizeRole(role)
  if (!normalizedRole) {
    return false
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  return allowedRoles.includes(normalizedRole)
}

export type AllowedRoles = readonly Role[] | null

export const ALL_ROLES = authRoles.all

/**
 * Helper function to ensure Admin role is always included in allowed roles.
 * Admin should have access to all routes that other roles can access.
 * @param roles - Array of roles to include Admin with
 * @returns Array of roles with Admin included
 */
export function getRolesWithAdmin(
  roles: readonly Role[] | null | undefined,
): readonly Role[] {
  if (roles === null || roles === undefined) {
    return authRoles.Admin
  }

  // If Admin is already in the array, return as is
  if (roles.includes("Admin")) {
    return roles
  }

  // Otherwise, add Admin to the array
  return ["Admin", ...roles] as const satisfies readonly Role[]
}

