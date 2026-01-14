"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CommandSearch, SearchTrigger } from "@/components/command-search"
import { ModeToggle } from "@/components/mode-toggle"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { clearCredentials } from "@/store/slices/authSlice"

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { token, user } = useAppSelector((state) => state.auth)
  const isAuthenticated = Boolean(token && user)

  const handleLogout = React.useCallback(() => {
    dispatch(clearCredentials())
    toast.success("You have been logged out")
    router.push("/")
  }, [dispatch, router])

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
