"use client"

import * as React from "react"
import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { LogOut, UserCog, Loader2, MoreVertical, Moon, Sun } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/notification-bell"
import { FontSizeControl } from "@/components/font-size-control"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useIsImpersonated } from "@/hooks/use-impersonation"
import { clearCredentials, setCredentials } from "@/store/slices/authSlice"
import { useChangeUserRoleMutation } from "@/store/api/user/userApi"
import type { AuthUser } from "@/store/api/auth/types"
import { buildUser, decodeJwtPayload } from "@/store/api/auth/api"
import { LanguageSwitcher } from "./language-switcher"
import { filterRolesFromApi } from "@/config/auth-roles"
import { useTheme } from "@/hooks/use-theme"
import { useCircularTransition } from "@/hooks/use-circular-transition"
import { locales, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"

const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  fr: "Français",
  ar: "العربية",
  pt: "Português",
  hi: "हिन्दी",
}

const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  zh: "🇨🇳",
  fr: "🇫🇷",
  ar: "🇸🇦",
  pt: "🇵🇹",
  hi: "🇮🇳",
}

const headerActionWrapClass =
  "shrink-0 [&_button]:h-8 [&_button]:w-8 md:[&_button]:h-9 md:[&_button]:w-9"

export function SiteHeader() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { token, user } = useAppSelector((state) => state.auth)
  const isAuthenticated = Boolean(token && user)
  const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation()
  const isImpersonated = useIsImpersonated()

  const availableRoles = filterRolesFromApi(user?.roles as string[] | undefined)
  const currentRole = user?.role || ""

  const handleLogout = React.useCallback(() => {
    dispatch(clearCredentials())
    toast.success("You have been logged out")
    window.location.href = "/"
  }, [dispatch])

  const handleRoleChange = React.useCallback(
    async (role: string) => {
      if (role === currentRole) {
        return
      }

      try {
        const response = await changeUserRole({ role }).unwrap()

        if (response.data) {
          const decoded = decodeJwtPayload(response.data.accessToken)
          const updatedUser: AuthUser = {
            ...buildUser({
              user: { ...(response.data.user as unknown as Record<string, unknown>), role },
              ...(decoded ? { decoded } : {}),
            }),
            role,
          }

          dispatch(
            setCredentials({
              token: response.data.accessToken,
              user: updatedUser,
              passwordChanged: true,
            })
          )

          toast.success(response.message || "Role changed successfully")

          if (role === "EQA") {
            router.push("/learners")
          } else {
            router.push("/dashboard")
          }
        }
      } catch (error) {
        const errorMessage =
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.error ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.data
            ?.message ||
          (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
          "Failed to change role"
        toast.error(errorMessage)
      }
    },
    [currentRole, changeUserRole, dispatch, router]
  )

  const { theme } = useTheme()
  const { toggleTheme } = useCircularTransition()
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const updateMode = () => {
      if (theme === "dark") {
        setIsDarkMode(true)
      } else if (theme === "light") {
        setIsDarkMode(false)
      } else {
        setIsDarkMode(
          typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        )
      }
    }

    updateMode()

    const mediaQuery =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null
    mediaQuery?.addEventListener("change", updateMode)

    return () => {
      mediaQuery?.removeEventListener("change", updateMode)
    }
  }, [theme])

  const handleThemeToggle = (event: React.MouseEvent<HTMLElement>) => {
    toggleTheme(event as React.MouseEvent<HTMLButtonElement>)
  }

  const switchLocale = (newLocale: Locale) => {
    const currentPath = window.location.pathname
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+/, "") || "/"
    const newPath = `/${newLocale}${pathWithoutLocale}${window.location.search}`
    window.location.href = newPath
  }

  const showRoleSwitcher =
    isAuthenticated &&
    user &&
    user.role !== "Learner" &&
    availableRoles.length > 0

  const roleMenuItems = showRoleSwitcher
    ? availableRoles
        .slice()
        .reverse()
        .map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleRoleChange(role)}
            disabled={isChangingRole || role === currentRole}
            className={role === currentRole ? "bg-accent" : ""}
          >
            {role}
            {role === currentRole && " (Current)"}
          </DropdownMenuItem>
        ))
    : null

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full min-w-0 items-center gap-1 px-2 py-2 sm:gap-1.5 sm:px-4 md:gap-2 lg:px-6 lg:py-3">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mx-1 hidden data-[orientation=vertical]:h-4 sm:block md:mx-2"
        />
        <div className="min-w-0 flex-1 max-w-sm" />

        {/* Mobile */}
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5 md:hidden">
          {isAuthenticated && (
            <div className={headerActionWrapClass}>
              <NotificationBell />
            </div>
          )}

          {showRoleSwitcher && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer bg-secondary border-secondary text-white shadow-sm hover:bg-secondary/90 hover:text-white hover:shadow-md"
                  disabled={isChangingRole}
                >
                  {isChangingRole ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCog className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {roleMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isAuthenticated && !isImpersonated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer border border-destructive bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:text-white hover:shadow-md"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="More header actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleThemeToggle}>
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                Switch to {isDarkMode ? "light" : "dark"} mode
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Language</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {locales.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => switchLocale(loc)}
                    >
                      <span className="mr-2">{localeFlags[loc]}</span>
                      {localeNames[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <FontSizeControl />
              </div>
              {!isAuthenticated && (
                <DropdownMenuItem asChild>
                  <Link href="/auth/sign-in">Sign In</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tablet/Desktop */}
        <div className="ml-auto hidden min-w-0 shrink-0 items-center gap-1.5 md:flex lg:gap-2">
          <div className={headerActionWrapClass}>
            <ModeToggle variant="outline" />
          </div>
          {isAuthenticated && (
            <div className={headerActionWrapClass}>
              <NotificationBell />
            </div>
          )}
          <div className={cn(headerActionWrapClass, "hidden lg:block")}>
            <FontSizeControl />
          </div>
          <div className={headerActionWrapClass}>
            <LanguageSwitcher />
          </div>
          {showRoleSwitcher && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 cursor-pointer bg-secondary border-secondary text-white shadow-sm hover:bg-secondary/90 hover:text-white hover:shadow-md"
                  disabled={isChangingRole}
                >
                  {isChangingRole ? (
                    <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />
                  ) : (
                    <UserCog className="h-[1.2rem] w-[1.2rem]" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {roleMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isAuthenticated ? (
            !isImpersonated && (
              <Button
                variant="ghost"
                className="h-9 cursor-pointer gap-2 border border-destructive bg-destructive px-3 text-white shadow-sm hover:bg-destructive/90 hover:text-white hover:shadow-md"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            )
          ) : (
            <Button variant="outline" size="sm" asChild className="cursor-pointer">
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
