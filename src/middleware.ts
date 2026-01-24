import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from 'next-intl/middleware';

import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/store/api/auth/api"
import { getAllowedRolesForPath } from "@/config/route-access"
import { isRoleAllowed } from "@/config/auth-roles"
import { routing } from "@/i18n/navigation"

// Create the i18n middleware using the routing configuration
const intlMiddleware = createMiddleware(routing)

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
  "/gap-analysis",
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

// Since locale is not in path, pathname is already clean
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

  // First, let i18n middleware handle locale routing
  // With localePrefix: 'never', it won't add locale to URLs but will handle locale detection
  const response = intlMiddleware(request)
  
  // If intl middleware redirected, return that response
  if (response.status === 307 || response.status === 308) {
    return response
  }

  // Handle auth redirects (no locale in URL)
  if (token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Require authentication for change-password page
  if (!token && pathname === '/auth/change-password') {
    const redirectUrl = new URL('/auth/sign-in', request.url)
    redirectUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Allow authenticated users to access change-password page
  if (token && pathname === '/auth/change-password') {
    return response
  }

  if (token && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Let auth routes through if no token (user needs to sign in)
  // Don't redirect, just let the response through
  if (!token && isAuthRoute(pathname)) {
    return response
  }

  if (!token && isProtectedRoute(pathname)) {
    const redirectUrl = new URL('/auth/sign-in', request.url)
    redirectUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (token && isProtectedRoute(pathname)) {
    const allowedRoles = getAllowedRolesForPath(pathname)

    // Check if user's role is allowed for this route
    // Admin role is included in all learner routes via route-access.ts
    if (!isRoleAllowed(userRole, allowedRoles)) {
      return NextResponse.redirect(new URL('/errors/unauthorized', request.url))
    }
  }

  return response
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
