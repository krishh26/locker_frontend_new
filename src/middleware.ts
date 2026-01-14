import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/store/api/auth/api"
import { getAllowedRolesForPath } from "@/config/route-access"
import { isRoleAllowed } from "@/config/auth-roles"

// Protected routes - all routes except public ones need authentication
// The route-access.ts file defines which roles can access which routes
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/cpd",
  "/forum",
  "/skills-scan",
  "/forms",
  "/surveys",
  "/demo",
  "/users",
  "/settings",
  "/pricing",
  "/evidence-library",
  "/module-unit-progress",
  "/learning-plan",
  "/course-resources",
  "/learners-documents-to-sign",
  "/resources",
  "/health-wellbeing",
  "/time-log",
  "/choose-units",
  "/course-details",
  "/calendar",
  "/chat",
  "/mail",
  "/tasks",
  "/dashboard-2",
  "/propose-your-innovations",
  "/support",
]

const AUTH_PATH_PREFIXES = ["/auth"]
const PUBLIC_PATH_PREFIXES = ["/"]

function isProtectedRoute(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isAuthRoute(pathname: string) {
  return AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isPublicRoute(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_COOKIE_KEY)?.value
  const userCookie = request.cookies.get(USER_COOKIE_KEY)?.value
  let userRole: string | null = null

  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie) as { role?: unknown }
      userRole = typeof parsed?.role === "string" ? parsed.role : null
    } catch {
      userRole = null
    }
  }

  if (token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (token && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!token && isProtectedRoute(pathname)) {
    const redirectUrl = new URL("/auth/sign-in", request.url)
    redirectUrl.searchParams.set("from", pathname)

    return NextResponse.redirect(redirectUrl)
  }

  if (token && isProtectedRoute(pathname)) {
    const allowedRoles = getAllowedRolesForPath(pathname)

    // Check if user's role is allowed for this route
    // Admin role is included in all learner routes via route-access.ts
    if (!isRoleAllowed(userRole, allowedRoles)) {
      return NextResponse.redirect(new URL("/errors/unauthorized", request.url))
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
