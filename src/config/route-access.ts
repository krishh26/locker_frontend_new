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

// Admin, Learner, and Trainer roles combined (for learner pages accessible to trainers)
const adminLearnerAndTrainerRoles = ["Admin", "Learner", "Trainer"] as const satisfies readonly Role[]

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
    roles: adminAndTrainerRoles,
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
  {
    pattern: /^\/awaiting-signature(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/gateway-report(?:\/|$)/,
    roles: authRoles.Admin,
  },
  {
    pattern: /^\/progress-exclusion(?:\/|$)/,
    roles: authRoles.Admin,
  },
  // Learner pages (accessible to Admin, Learner, and Trainer)
  {
    pattern: /^\/cpd(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/forum(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/skills-scan(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
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
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/learner-forms(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/support(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/surveys(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/evidence-library(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/module-unit-progress(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/learning-plan(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/course-resources(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/learners-documents-to-sign(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/resources(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/health-wellbeing(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/time-log(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/choose-units(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/course-details(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/chat(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/mail(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  {
    pattern: /^\/tasks(?:\/|$)/,
    roles: adminLearnerAndTrainerRoles,
  },
  // Dashboard 2 (Admin and Trainer)
  {
    pattern: /^\/dashboard-2(?:\/|$)/,
    roles: adminAndTrainerRoles,
  },
  // Trainer-only routes
  {
    pattern: /^\/learner-overview(?:\/|$)/,
    roles: authRoles.Trainer,
  },
  {
    pattern: /^\/learner-dashboard\/\d+(?:\/|$)/,
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

