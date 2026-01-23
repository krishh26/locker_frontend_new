const baseRoles = [
  "MasterAdmin",
  "Admin",
  "Learner",
  "Trainer",
  "Employer",
  "LIQA",
  "IQA",
  "EQA",
] as const

export type Role = (typeof baseRoles)[number]

export const authRoles = {
  MasterAdmin: ["MasterAdmin"] as const satisfies readonly Role[],
  Admin: ["Admin"] as const satisfies readonly Role[],
  Learner: ["Learner"] as const satisfies readonly Role[],
  Trainer: ["Trainer"] as const satisfies readonly Role[],
  Employer: ["Employer"] as const satisfies readonly Role[],
  LIQA: ["LIQA"] as const satisfies readonly Role[],
  IQA: ["IQA"] as const satisfies readonly Role[],
  EQA: ["EQA"] as const satisfies readonly Role[],
  all: [...baseRoles] as const satisfies readonly Role[],
  onlyGuest: null,
} as const

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") {
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

/**
 * Helper function to ensure MasterAdmin role is always included in allowed roles.
 * MasterAdmin should have access to all routes that other roles can access.
 * @param roles - Array of roles to include MasterAdmin with
 * @returns Array of roles with MasterAdmin included
 */
export function getRolesWithMasterAdmin(
  roles: readonly Role[] | null | undefined,
): readonly Role[] {
  if (roles === null || roles === undefined) {
    return authRoles.MasterAdmin
  }

  // If MasterAdmin is already in the array, return as is
  if (roles.includes("MasterAdmin")) {
    return roles
  }

  // Otherwise, add MasterAdmin to the array
  return ["MasterAdmin", ...roles] as const satisfies readonly Role[]
}

