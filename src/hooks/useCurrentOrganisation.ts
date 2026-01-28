import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"

/**
 * Hook to get the current user's organisation ID
 * 
 * @returns organisationId or null
 * - For MasterAdmin: returns null (has access to all)
 * - For AccountManager: returns first assigned organisation ID
 * - For other roles: may need organisation context (returns null for now)
 */
export function useCurrentOrganisation(): number | null {
  const user = useAppSelector(selectAuthUser)

  if (!user) {
    return null
  }

  // MasterAdmin has access to all organisations
  if (isMasterAdmin(user)) {
    return null
  }

  // AccountManager: use first assigned organisation
  if (user.assignedOrganisationIds && user.assignedOrganisationIds.length > 0) {
    return user.assignedOrganisationIds[0]
  }

  // For other roles, we may need organisation context
  // For now, return null (they may not have organisation-based features)
  return null
}
