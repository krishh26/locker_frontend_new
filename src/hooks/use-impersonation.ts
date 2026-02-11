import { useEffect, useState } from "react"

const IMPERSONATION_KEY = "locker.impersonated"

/**
 * Hook to check if the current tab is an impersonated session.
 * Uses sessionStorage (per-tab) so the MasterAdmin's original tab is unaffected.
 *
 * @returns `true` when the current tab was opened via the "Login As" impersonation flow.
 */
export function useIsImpersonated(): boolean {
  const [isImpersonated, setIsImpersonated] = useState(false)

  useEffect(() => {
    setIsImpersonated(sessionStorage.getItem(IMPERSONATION_KEY) === "true")
  }, [])

  return isImpersonated
}
