/**
 * Subscription guards and utilities
 * These functions help enforce subscription limits and feature access in the UI
 */

import { isFeatureFree } from "@/config/feature-mapping"

export interface Subscription {
  plan: string
  userLimit: number
  usedUsers: number
  isExpired: boolean
  expiryDate?: string
  features?: string[]
}

/**
 * Check if a feature is enabled for the subscription
 * 
 * NOTE: This function uses hardcoded plan features for backward compatibility.
 * For new code, use the Feature Control API via useFeatureAccess hook instead.
 * 
 * @deprecated Use Feature Control API (useFeatureAccess hook) for feature checking
 */
export function isFeatureEnabled(
  subscription: Subscription | null | undefined,
  feature: string
): boolean {
  if (!subscription || subscription.isExpired) {
    return false
  }

  // Free features are always enabled
  if (isFeatureFree(feature)) {
    return true
  }

  // If subscription has explicit features list, check it
  if (subscription.features) {
    return subscription.features.includes(feature)
  }

  // Default feature mapping based on plan (backward compatibility)
  // NOTE: This is a fallback. The Feature Control system should be used instead.
  const planFeatures: Record<string, string[]> = {
    Basic: ["basic_features"],
    Standard: ["basic_features", "standard_features", "advanced_reporting"],
    Premium: [
      "basic_features",
      "standard_features",
      "advanced_reporting",
      "premium_features",
      "api_access",
    ],
    Enterprise: [
      "basic_features",
      "standard_features",
      "advanced_reporting",
      "premium_features",
      "api_access",
      "custom_integrations",
      "priority_support",
    ],
  }

  const allowedFeatures = planFeatures[subscription.plan] || []
  return allowedFeatures.includes(feature)
}

/**
 * Check if subscription is in read-only mode (expired)
 */
export function isReadOnlyMode(
  subscription: Subscription | null | undefined
): boolean {
  if (!subscription) {
    return true
  }
  return subscription.isExpired
}

/**
 * Check if user can be added (user limit not reached)
 */
export function canAddUser(
  subscription: Subscription | null | undefined
): boolean {
  if (!subscription || isReadOnlyMode(subscription)) {
    return false
  }
  return subscription.usedUsers < subscription.userLimit
}

/**
 * Get remaining user slots available
 */
export function getRemainingUsers(
  subscription: Subscription | null | undefined
): number {
  if (!subscription || isReadOnlyMode(subscription)) {
    return 0
  }
  return Math.max(0, subscription.userLimit - subscription.usedUsers)
}

/**
 * Check if user limit is reached
 */
export function isUserLimitReached(
  subscription: Subscription | null | undefined
): boolean {
  if (!subscription) {
    return true
  }
  return subscription.usedUsers >= subscription.userLimit
}

/**
 * Get subscription status message
 */
export function getSubscriptionStatus(
  subscription: Subscription | null | undefined
): {
  status: "active" | "expired" | "limit_reached" | "warning" | "unknown"
  message: string
} {
  if (!subscription) {
    return {
      status: "unknown",
      message: "No subscription found",
    }
  }

  if (subscription.isExpired) {
    return {
      status: "expired",
      message: "Subscription has expired. Please renew to continue.",
    }
  }

  if (isUserLimitReached(subscription)) {
    return {
      status: "limit_reached",
      message: `User limit reached (${subscription.usedUsers}/${subscription.userLimit}). Upgrade to add more users.`,
    }
  }

  const remaining = getRemainingUsers(subscription)
  if (remaining <= 5) {
    return {
      status: "warning",
      message: `Only ${remaining} user slot${remaining === 1 ? "" : "s"} remaining.`,
    }
  }

  return {
    status: "active",
    message: `Active subscription. ${remaining} user slot${remaining === 1 ? "" : "s"} available.`,
  }
}
