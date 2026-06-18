const baseRoles = [
  "Admin",
  "Learner",
  "Trainer",
  "Employer",
  "LIQA",
  "IQA",
  "EQA",
  "MasterAdmin",
  "PhoenixTeam",
  "AccountManager",
] as const

/** API roles that map to Admin for access, sidebar, and redirects */
export const ADMIN_EQUIVALENT_ROLES = ["CentreAdmin", "OrganisationAdmin"] as const

/** Roles returned by API that we strip from auth/display (not used in app) */
export const ROLES_STRIPPED_FROM_API = ["LIQA", "Line Manager"] as const

export type Role = (typeof baseRoles)[number]

/**
 * Normalise API role arrays: OrganisationAdmin/CentreAdmin become Admin;
 * strip unused roles from display/switcher.
 */
export function filterRolesFromApi(roles: string[] | null | undefined): string[] {
  if (!Array.isArray(roles) || roles.length === 0) return []

  const result: string[] = []

  for (const role of roles) {
    if ((ADMIN_EQUIVALENT_ROLES as readonly string[]).includes(role)) {
      if (!result.includes("Admin")) {
        result.push("Admin")
      }
      continue
    }

    if ((ROLES_STRIPPED_FROM_API as readonly string[]).includes(role)) {
      continue
    }

    if ((baseRoles as readonly string[]).includes(role) && !result.includes(role)) {
      result.push(role)
    }
  }

  return result
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
  PhoenixTeam: ["PhoenixTeam"] as const satisfies readonly Role[],
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

  if ((ADMIN_EQUIVALENT_ROLES as readonly string[]).includes(role)) {
    return "Admin"
  }

  if ((ROLES_STRIPPED_FROM_API as readonly string[]).includes(role)) {
    return null
  }

  return (baseRoles as readonly string[]).includes(role)
    ? (role as Role)
    : null
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRole(role) === "Admin"
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
