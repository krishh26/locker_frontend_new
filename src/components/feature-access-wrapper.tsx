"use client"

import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { useFeatureAccess } from "@/hooks/useFeatureAccess"
import { isMasterAdmin } from "@/utils/permissions"
import { isFeatureFree } from "@/config/feature-mapping"

/**
 * Component that checks feature access for a single feature code
 * Returns children if feature is accessible, null otherwise
 */
export function FeatureAccessWrapper({
  featureCode,
  isFree,
  children,
}: {
  featureCode?: string
  isFree?: boolean
  children: React.ReactNode
}) {
  const user = useAppSelector(selectAuthUser)

  // Always call the hook unconditionally (Rules of Hooks requirement)
  // Use empty string as fallback when featureCode is undefined
  // The hook will handle the undefined case internally
  const { hasAccess, isLoading } = useFeatureAccess(featureCode || "")

  // If no feature code, always show (no access check needed)
  if (!featureCode) {
    return <>{children}</>
  }

  // MasterAdmin sees all features
  if (isMasterAdmin(user)) {
    return <>{children}</>
  }

  // Free features are always visible
  if (isFree || isFeatureFree(featureCode)) {
    return <>{children}</>
  }

  // Show loading state or hide item
  if (isLoading) {
    return null // Hide while loading to prevent flickering
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}
