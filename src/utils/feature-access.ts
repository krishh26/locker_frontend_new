import { isFeatureFree } from "@/config/feature-mapping"
import { isMasterAdmin } from "@/utils/permissions"
import type { AuthUser } from "@/store/api/auth/types"

/**
 * Check if a menu item should be shown based on feature access
 * 
 * @param item - Sidebar item with optional featureCode and isFree
 * @param user - Current user
 * @param hasFeatureAccess - Whether the feature is accessible (from useFeatureAccess hook)
 * @returns true if item should be shown, false otherwise
 */
export function shouldShowMenuItem(
  item: { featureCode?: string; isFree?: boolean },
  user: AuthUser | null,
  hasFeatureAccess: boolean
): boolean {
  // If item has no feature code, show based on role only (existing behavior)
  if (!item.featureCode) {
    return true
  }

  // MasterAdmin sees all features
  if (isMasterAdmin(user)) {
    return true
  }

  // If marked as free, always show
  if (item.isFree || isFeatureFree(item.featureCode)) {
    return true
  }

  // Otherwise, check feature access
  return hasFeatureAccess
}

/**
 * Get feature code from menu item
 * Uses featureCode property or looks up from route
 * 
 * @param item - Sidebar item
 * @returns Feature code or null
 */
export function getFeatureCodeFromItem(item: {
  featureCode?: string
  url?: string
}): string | null {
  if (item.featureCode) {
    return item.featureCode
  }

  // Could look up from route if needed
  // For now, require explicit featureCode
  return null
}
