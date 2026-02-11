"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch } from "@/store/hooks"
import { setCredentials } from "@/store/slices/authSlice"
import type { LoginResult } from "@/store/api/auth/types"

const IMPERSONATE_STORAGE_PREFIX = "locker.impersonate."

export default function ImpersonatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const key = searchParams.get("key")
    if (!key) {
      router.replace("/auth/sign-in")
      return
    }

    const storageKey = `${IMPERSONATE_STORAGE_PREFIX}${key}`

    try {
      const raw = localStorage.getItem(storageKey)
      // Clean up immediately
      localStorage.removeItem(storageKey)

      if (!raw) {
        router.replace("/auth/sign-in")
        return
      }

      const data: LoginResult = JSON.parse(raw)

      if (!data.token || !data.user) {
        router.replace("/auth/sign-in")
        return
      }

      // Set credentials in Redux (auto-syncs to cookies via provider.tsx)
      dispatch(setCredentials(data))

      // Mark this tab as an impersonated session (per-tab via sessionStorage)
      sessionStorage.setItem("locker.impersonated", "true")

      // Redirect to dashboard
      router.replace("/dashboard")
    } catch {
      router.replace("/auth/sign-in")
    }
  }, [searchParams, dispatch, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Signing in...</p>
      </div>
    </div>
  )
}
