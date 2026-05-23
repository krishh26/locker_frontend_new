import type { AuthUser } from "@/store/api/auth/types"
import type { User } from "@/store/api/user/types"
import { filterRolesFromApi } from "@/config/auth-roles"
import { resolveActiveUserRole } from "@/lib/auth/resolve-active-user-role"

/**
 * Maps `/user/get` response (`User`) to the `AuthUser` shape stored in Redux after login.
 *
 * @param currentRole - Active role from Redux/cookie; preserved when still in `roles`
 *   so change-role is not reset to `roles[0]` on refresh or dashboard sync.
 */
export function mapUserApiToAuthUser(
  userData: User,
  currentRole?: string | null,
): AuthUser {
  const assignedCenters =
    userData.assigned_centers ?? userData.assigned_centres ?? []
  const assignedCenterIds =
    assignedCenters.length > 0
      ? assignedCenters.map((c: { id: number }) => c.id)
      : null

  let assignedOrganisationIds =
    userData.assigned_organisations?.map((org: { id: number }) => org.id) ??
    null
  if (
    (!assignedOrganisationIds || assignedOrganisationIds.length === 0) &&
    userData.userCentres?.length
  ) {
    const orgIds = [
      ...new Set(
        userData.userCentres
          .map((uc: { centre?: { organisation_id?: number } }) =>
            uc.centre?.organisation_id,
          )
          .filter((id): id is number => typeof id === "number"),
      ),
    ]
    assignedOrganisationIds = orgIds.length > 0 ? orgIds : null
  }

  const filteredRoles = filterRolesFromApi(userData.roles)
  const role = resolveActiveUserRole(userData.roles, {
    apiRole: userData.role,
    currentRole,
  })

  return {
    id: userData.user_id?.toString(),
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    role,
    roles: filteredRoles.length > 0 ? filteredRoles : undefined,
    user_id: userData.user_id,
    user_name: userData.user_name,
    mobile: userData.mobile,
    avatar: userData.avatar,
    password_changed: userData.password_changed,
    time_zone: userData.time_zone,
    status: userData.status,
    line_manager: userData.line_manager,
    number_of_active_learners: userData.number_of_active_learners,
    assigned_employers: userData.assigned_employers,
    userEmployers: userData.userEmployers,
    assigned_organisations: userData.assigned_organisations,
    assignedOrganisationIds,
    assigned_centers: assignedCenters.length > 0 ? assignedCenters : undefined,
    assignedCenterIds,
  }
}
