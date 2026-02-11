"use client"

import { useRouter } from "@/i18n/navigation"
import {
  EllipsisVertical,
  LogOut,
  BellDot,
  UserCog,
  Loader2,
} from "lucide-react"
import Link from "next/link"

import { Lock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { useIsImpersonated } from "@/hooks/use-impersonation"
import { setCredentials } from "@/store/slices/authSlice"
import { useChangeUserRoleMutation } from "@/store/api/user/userApi"
import { toast } from "sonner"
import type { AuthUser } from "@/store/api/auth/types"
import type { User } from "@/store/api/user/types"
export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)
  const [changeUserRole, { isLoading: isChangingRole }] = useChangeUserRoleMutation()
  const isImpersonated = useIsImpersonated()

  // Get display name and email - prefer user, fallback to learner
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || (user as { user_name?: string })?.user_name || "User"
    : learner
    ? `${learner.first_name} ${learner.last_name}`
    : "User"

  const displayEmail = user?.email || learner?.email || ""

  // Get available roles from user object
  const availableRoles = (user?.roles as string[] | undefined) || []
  const currentRole = user?.role || ""

  // Handle role change
  const handleRoleChange = async (role: string) => {
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
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {displayEmail}
                  {currentRole && ` • ${currentRole}`}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="h-8 w-8 rounded-lg">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                    {currentRole && ` • ${currentRole}`}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/notifications">
                  <BellDot />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Change Role - Only show for non-Learner users */}
            {user && user.role !== "Learner" && availableRoles.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={isChangingRole}>
                  {isChangingRole ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <UserCog className="h-4 w-4 mr-2" />
                      Change Role
                    </>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
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
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {!isImpersonated && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/auth/sign-in">
                    <LogOut className="mr-1" />
                    Log out
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
