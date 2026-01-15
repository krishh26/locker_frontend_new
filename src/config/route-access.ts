import {
  ALL_ROLES,
  authRoles,
  type AllowedRoles,
  type Role,
} from "@/config/auth-roles"

type RouteRule = {
  pattern: RegExp
  roles: AllowedRoles
}

// Admin and Learner roles combined (Admin can access all learner pages)
const adminAndLearnerRoles = ["Admin", "Learner"] as const satisfies readonly Role[]

// Admin and Trainer roles combined
const adminAndTrainerRoles = ["Admin", "Trainer"] as const satisfies readonly Role[]

const routeRoleRules: RouteRule[] = [
  // Admin-only routes
  {
    pattern: /^\/admin(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/users(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/learners(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/employers(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/broadcast(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/course-builder(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/settings(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/pricing(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/demo(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/calendar(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/funding-bands(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/caseload(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/safeguarding(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/acknowledge-message(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/default-review-weeks(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/iqa-questions(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/session-types(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/timelog-export(?:\/|$)/,
    roles: authRoles.Admin,
  },
  // Learner pages (accessible to Admin and Learner)
  {
    pattern: /^\/cpd(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/forum(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/skills-scan(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/forms(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/forms\/[^/]+\/builder(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/trainer-risk-rating(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/wellbeing(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/propose-your-innovations(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/learner-forms(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/support(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/surveys(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/evidence-library(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/module-unit-progress(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/learning-plan(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/course-resources(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/learners-documents-to-sign(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/resources(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/health-wellbeing(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/time-log(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/choose-units(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/course-details(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/chat(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/mail(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  {
    pattern: /^\/tasks(?:\/|$)/,
    roles: adminAndLearnerRoles,
  },
  // Dashboard 2 (Admin and Trainer)
  {
    pattern: /^\/dashboard-2(?:\/|$)/,
    roles: adminAndTrainerRoles,
  },
  // Main dashboard (accessible to all roles - content is role-based)
  {
    pattern: /^\/dashboard\/?$/,
    roles: ALL_ROLES,
  },
]

export function getAllowedRolesForPath(pathname: string): AllowedRoles {
  const matchedRule = routeRoleRules.find((rule) => rule.pattern.test(pathname))
  if (matchedRule) {
    return matchedRule.roles
  }

  // Default: Admin can access everything, but for unmatched routes,
  // we'll return ALL_ROLES to maintain backward compatibility
  // In production, you might want to be more restrictive
  return ALL_ROLES
}

export { routeRoleRules }

