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
  masterAdminOnly: (): readonly Role[] => authRoles.masterAdminOnly,
  masterAdminAndAccountManager: (): readonly Role[] => authRoles.masterAdminAndAccountManager,
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
    roles: R.adminWith("AccountManager"),
  },
  {
    pattern: /^\/users\/add(?:\/|$)/,
    roles: R.adminWith("AccountManager"),
  },
  {
    pattern: /^\/users\/edit\/\d+(?:\/|$)/,
    roles: R.adminWith("AccountManager"),
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
    roles: R.adminWith("MasterAdmin"),
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
    roles: R.adminWith("IQA" ,"EQA"),
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
    roles: R.adminWith("Learner", "Trainer", "IQA", "Employer"),
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
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/module-unit-progress(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/gap-analysis(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/learning-plan(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/course-resources(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/learners-documents-to-sign(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/resources(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/health-wellbeing(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/time-log(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/choose-units(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
  },
  {
    pattern: /^\/course-details(?:\/|$)/,
    roles: R.adminWith("Learner", "Trainer","Employer"),
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
  // Main dashboard (accessible to all roles except EQA - content is role-based)
  {
    pattern: /^\/dashboard\/?$/,
    roles: R.adminWith("Learner", "Trainer", "IQA", "Employer", "MasterAdmin", "AccountManager"),
  },
  // IV Report (accessible to all roles)
  {
    pattern: /^\/iqa-report(?:\/|$)/,
    roles: R.all(),
  },
  // Change Password (accessible to all authenticated users)
  {
    pattern: /^\/auth\/change-password(?:\/|$)/,
    roles: R.all(),
  },
  // Master Admin & Account Manager routes
  {
    pattern: /^\/organisations(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  {
    pattern: /^\/organisations\/\d+(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  {
    pattern: /^\/centres(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  {
    pattern: /^\/subscriptions(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  {
    pattern: /^\/payments(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  {
    pattern: /^\/audit-logs(?:\/|$)/,
    roles: R.masterAdminAndAccountManager(),
  },
  // Master Admin only routes
  {
    pattern: /^\/system-admin(?:\/|$)/,
    roles: R.masterAdminOnly(),
  },
  {
    pattern: /^\/account-manager(?:\/|$)/,
    roles: R.masterAdminOnly(),
  },
  {
    pattern: /^\/feature-control(?:\/|$)/,
    roles: R.masterAdminOnly(),
  },
]

export function getAllowedRolesForPath(pathname: string): AllowedRoles {
  const matchedRule = routeRoleRules.find((rule) => rule.pattern.test(pathname))
  return matchedRule?.roles ?? ALL_ROLES
}

export function canAccess(pathname: string, role: string | null): boolean {
  // Admin and MasterAdmin have access to all routes
  if (role === "Admin" || role === "MasterAdmin") {
    return true
  }
  const allowedRoles = getAllowedRolesForPath(pathname)
  return isRoleAllowed(role, allowedRoles)
}

export { routeRoleRules }

