"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, UserCog, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger } from "@/components/command-search"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationBell } from "@/components/notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { clearCredentials, setCredentials } from "@/store/slices/authSlice"
import { useChangeUserRoleMutation } from "@/store/api/user/userApi"
import type { AuthUser } from "@/store/api/auth/types"
import type { User } from "@/store/api/user/types"

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { token, user } = useAppSelector((state) => state.auth)
  const isAuthenticated = Boolean(token && user)
  const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation()

  // Get available roles from user object
  const availableRoles = (user?.roles as string[] | undefined) || []
  const currentRole = user?.role || ""

  const handleLogout = React.useCallback(() => {
    dispatch(clearCredentials())
    toast.success("You have been logged out")
    router.push("/")
  }, [dispatch, router])

  // Handle role change
  const handleRoleChange = React.useCallback(
    async (role: string) => {
      if (role === currentRole) {
        return // Don't change if already selected
      }

      try {
        const response = await changeUserRole({ role }).unwrap()

        if (response.data) {
          // Transform the user object from API response to AuthUser format
          const apiUser = response.data.user as User & { role?: string }

          const updatedUser: AuthUser = {
            ...apiUser, // Include all properties first
            id: apiUser.user_id?.toString(),
            firstName: apiUser.first_name,
            lastName: apiUser.last_name,
            email: apiUser.email,
            roles: apiUser.roles,
            role: apiUser.role,
          }

          // Update Redux store with new token and user
          dispatch(
            setCredentials({
              token: response.data.accessToken,
              user: updatedUser,
              passwordChanged: true,
            })
          )

          toast.success(response.message || "Role changed successfully")

          // Navigate to dashboard
          router.push("/dashboard")
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

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex-1 max-w-sm">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://shadcnstore.com/blocks"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                Blocks
              </a>
            </Button> */}
            {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="/"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                Landing Page
              </a>
            </Button> */}
            {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://github.com/silicondeck/shadcn-dashboard-landing-template"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                GitHub
              </a>
            </Button> */}
            <ModeToggle />
            {isAuthenticated && <NotificationBell />}
            {/* Change Role - Only show for non-Learner users */}
            {isAuthenticated &&
              user &&
              user.role !== "Learner" &&
              availableRoles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
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
                    {availableRoles
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
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                className="cursor-pointer gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="cursor-pointer">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
