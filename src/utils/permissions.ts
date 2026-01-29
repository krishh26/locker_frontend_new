/**
 * Permission utilities for Master Admin and Account Manager roles
 * 
 * These are pure functions that determine access based on user role and assigned organisations.
 * This file will NOT change when backend arrives - it only depends on user data structure.
 */

export type UserWithOrganisations = {
  role?: string
  assignedOrganisationIds?: number[]
}

/**
 * Check if user is Master Admin
 */
export function isMasterAdmin(user: UserWithOrganisations | null): boolean {
  return user?.role === "MasterAdmin"
}

/**
 * Check if user is Account Manager
 */
export function isAccountManager(user: UserWithOrganisations | null): boolean {
  return user?.role === "AccountManager"
}

/**
 * Get accessible organisation IDs for a user
 * 
 * @returns null if user can access all organisations (MasterAdmin)
 * @returns array of organisation IDs if user has restricted access (AccountManager)
 * @returns empty array if user has no access
 */
export function getAccessibleOrganisationIds(
  user: UserWithOrganisations | null
): number[] | null {
  if (!user) {
    return []
  }

  // MasterAdmin has access to all organisations
  if (isMasterAdmin(user)) {
    return null // null means "all accessible"
  }

  // AccountManager has access only to assigned organisations
  if (isAccountManager(user)) {
    return user.assignedOrganisationIds || []
  }

  // Other roles have no access
  return []
}

/**
 * Check if user can access a specific organisation
 * 
 * @param user - User object with role and assignedOrganisationIds
 * @param organisationId - ID of the organisation to check access for
 * @returns true if user can access the organisation, false otherwise
 */
export function canAccessOrganisation(
  user: UserWithOrganisations | null,
  organisationId: number
): boolean {
  if (!user) {
    return false
  }

  // MasterAdmin can access all organisations
  if (isMasterAdmin(user)) {
    return true
  }

  // AccountManager can only access assigned organisations
  if (isAccountManager(user)) {
    const assignedIds = user.assignedOrganisationIds || []
    return assignedIds.includes(organisationId)
  }

  // Other roles cannot access organisations
  return false
}
