import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from 'next-intl/middleware';

import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/store/api/auth/api"
import { canAccess } from "@/config/route-access"
import { resolveSessionRole } from "@/lib/auth/session-role"
import { routing } from "@/i18n/navigation"

// Create the i18n proxy using the routing configuration
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
  "/supplementary-training",
  "/sup-training",
  "/time-log",
  "/choose-units",
  "/course-details",
  "/calendar",
  "/chat",
  "/mail",
  "/tasks",
  "/propose-your-innovations",
  "/support",
  "/tickets",
  "/organisations",
  "/centres",
  "/subscriptions",
  "/payments",
  "/audit-logs",
]

const AUTH_PATH_PREFIXES = ["/auth"]
const PUBLIC_PATH = "/"

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
  return pathname === PUBLIC_PATH
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(TOKEN_COOKIE_KEY)?.value
  const userCookie = request.cookies.get(USER_COOKIE_KEY)?.value
  const userRole = resolveSessionRole(token, userCookie)
  
  // First, let next-intl handle locale routing
  // With localePrefix: 'never', URLs stay clean but requests rewrite to /[locale]/...
  const response = intlMiddleware(request)
  
  // If intl proxy redirected, return that response
  if (response.status === 307 || response.status === 308) {
    return response
  }

  // Handle auth redirects (no locale in URL)
  if (token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Do not allow unauthenticated users to open landing page directly
  if (!token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
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

  // Allow access to impersonate page (MasterAdmin login-as-admin flow)
  if (pathname === '/auth/impersonate') {
    return response
  }

  if (token && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Let auth routes through if no token (user needs to sign in)
  if (!token && isAuthRoute(pathname)) {
    return response
  }

  if (!token && isProtectedRoute(pathname)) {
    const redirectUrl = new URL('/auth/sign-in', request.url)
    redirectUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (token && isProtectedRoute(pathname)) {
    // Use canAccess which properly handles Admin, MasterAdmin, and AccountManager
    if (!canAccess(pathname, userRole)) {
      return NextResponse.redirect(new URL('/errors/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Match all pathnames except api, Next.js internals, and static files
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
}
