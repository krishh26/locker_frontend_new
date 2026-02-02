import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"

/**
 * Hook to get the current user's organisation ID for feature-access checks.
 *
 * @returns organisationId or null
 * - For MasterAdmin: returns null (has access to all; no org needed for check)
 * - For any other role: returns first assigned organisation ID if present (from
 *   assignedOrganisationIds, which backend sets for AccountManager and for
 *   org-scoped users e.g. Admin via UserOrganisation), so check-access API can
 *   run and menu items show based on that org's subscription.
 */
export function useCurrentOrganisation(): number | null {
  const user = useAppSelector(selectAuthUser)

  if (!user) {
    return null
  }

  // MasterAdmin has access to all organisations; no single org needed
  if (isMasterAdmin(user)) {
    return null
  }

  // Use first assigned organisation for feature-access checks (AccountManager,
  // Admin, and any role with UserOrganisation get assignedOrganisationIds from backend)
  if (user.assignedOrganisationIds && user.assignedOrganisationIds.length > 0) {
    return user.assignedOrganisationIds[0]
  }

  return null
}
