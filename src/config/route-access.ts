import {
  ALL_ROLES,
  authRoles,
  isRoleAllowed,
  type AllowedRoles,
  type Role,
} from "@/config/auth-roles"

type RouteRule = {
  pattern: RegExp
  roles: AllowedRoles
}

// Role helper for creating reusable role combinations
const R = {
  admin: (): readonly Role[] => authRoles.Admin,
  with: (...roles: Role[]): readonly Role[] => roles as readonly Role[],
  adminWith: (...roles: Role[]): readonly Role[] => {
    const uniqueRoles = new Set<Role>(["Admin", ...roles])
    return Array.from(uniqueRoles) as readonly Role[]
  },
  all: (): readonly Role[] => ALL_ROLES,
} as const

const routeRoleRules: RouteRule[] = [
  // Admin-only routes
  {
    pattern: /^\/admin(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/users(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/users\/add(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/users\/edit\/\d+(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/learners(?:\/|$)/,
    roles: R.adminWith("Trainer", "IQA", "Employer", "EQA"),
  },
  {
    pattern: /^\/calendar(?:\/|$)/,
    roles: R.adminWith("Trainer", "IQA"),
  },
  {
    pattern: /^\/learner-profile(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/employers(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/broadcast(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/course-builder(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/settings(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/pricing(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/demo(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/demo-calendar(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/funding-bands(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/qa-sample-plan(?:\/|$)/,
    roles: R.adminWith("IQA"),
  },
  {
    pattern: /^\/caseload(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/safeguarding(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/acknowledge-message(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/default-review-weeks(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/iqa-questions(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/session-types(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/timelog-export(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/awaiting-signature(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/gateway-report(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/progress-exclusion(?:\/|$)/,
    roles: R.admin(),
  },
  // Learner pages
  {
    pattern: /^\/cpd(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer", "IQA"),
  },
  {
    pattern: /^\/forum(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer", "IQA"),
  },
  {
    pattern: /^\/skills-scan(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  // Specific form routes must come before general /forms pattern
  {
    pattern: /^\/forms\/submitted\/[^/]+\/[^/]+\/view(?:\/|$)/,
    roles: R.adminWith("Trainer"),
  },
  {
    pattern: /^\/forms\/[^/]+\/builder(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/forms(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/trainer-risk-rating(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/wellbeing(?:\/|$)/,
    roles: R.admin(),
  },
  {
    pattern: /^\/propose-your-innovations(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer", "IQA", "Employer", "EQA"),
  },
  {
    pattern: /^\/learner-forms(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/support(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer", "IQA", "Employer", "EQA"),
  },
  {
    pattern: /^\/surveys(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/evidence-library(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/module-unit-progress(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/learning-plan(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/course-resources(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/learners-documents-to-sign(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/resources(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/health-wellbeing(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/time-log(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/choose-units(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/course-details(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/chat(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/mail(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  {
    pattern: /^\/tasks(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer"),
  },
  // Dashboard 2 (Admin and Trainer)
  {
    pattern: /^\/dashboard-2(?:\/|$)/,
    roles: R.adminWith("Trainer"),
  },
  // Trainer-only routes (Admin can also access)
  {
    pattern: /^\/learner-overview(?:\/|$)/,
    roles: R.adminWith("Trainer"),
  },
  {
    pattern: /^\/learner-dashboard\/\d+(?:\/|$)/,
    roles: R.adminWith("Trainer"),
  },
  {
    pattern: /^\/learners-forms(?:\/|$)/,
    roles: R.adminWith("Trainer"),
  },
  // Main dashboard (accessible to all roles - content is role-based)
  {
    pattern: /^\/dashboard\/?$/,
    roles: R.all(),
  },
]

export function getAllowedRolesForPath(pathname: string): AllowedRoles {
  const matchedRule = routeRoleRules.find((rule) => rule.pattern.test(pathname))
  return matchedRule?.roles ?? ALL_ROLES
}

export function canAccess(pathname: string, role: string | null): boolean {
  if (role === "Admin") {
    return true
  }
  const allowedRoles = getAllowedRolesForPath(pathname)
  return isRoleAllowed(role, allowedRoles)
}

export { routeRoleRules }

