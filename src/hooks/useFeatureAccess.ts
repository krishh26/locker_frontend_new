import { useState, useEffect, useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { useCurrentOrganisation } from "./useCurrentOrganisation"
import { useGetSubscriptionQuery } from "@/store/api/subscriptions/subscriptionApi"
import { useCheckFeatureAccessMutation } from "@/store/api/feature-control/featureControlApi"
import { isMasterAdmin } from "@/utils/permissions"
import type { Subscription } from "@/store/api/subscriptions/types"
import { FREE_FEATURES } from "@/config/feature-mapping"

interface UseFeatureAccessResult {
  hasAccess: boolean
  isLoading: boolean
  subscription: Subscription | null
  error: string | null
}

/**
 * Hook to check if a feature is available for the current user's organisation
 * 
 * @param featureCode - The feature code to check (e.g., 'ADVANCED_REPORTS')
 * @returns Object with hasAccess, isLoading, subscription, and error
 */
export function useFeatureAccess(featureCode: string): UseFeatureAccessResult {
  const user = useAppSelector(selectAuthUser)
  const organisationId = useCurrentOrganisation()
  const [checkAccess, { isLoading: isChecking }] = useCheckFeatureAccessMutation()
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Get subscription for organisation
  const {
    data: subscriptionData,
    isLoading: isLoadingSubscription,
  } = useGetSubscriptionQuery(organisationId || 0, {
    skip: !organisationId || isMasterAdmin(user),
  })

  const subscription = subscriptionData?.data || null
  const isLoading = isLoadingSubscription || isChecking

  // Check if feature is free
  const isFree = useMemo(() => {
    return FREE_FEATURES.includes(featureCode)
  }, [featureCode])

  // MasterAdmin has access to all features
  const isMasterAdminUser = useMemo(() => {
    return isMasterAdmin(user)
  }, [user])

  useEffect(() => {
    // Reset state when feature code or organisation changes
    setHasAccess(false)
    setError(null)

    // If feature code is empty, grant access (for components that don't need feature checking)
    if (!featureCode || featureCode.trim() === "") {
      setHasAccess(true)
      return
    }

    // Free features are always accessible
    if (isFree) {
      setHasAccess(true)
      return
    }

    // MasterAdmin has access to all features
    if (isMasterAdminUser) {
      setHasAccess(true)
      return
    }

    // If no organisation, no access (except for free features and MasterAdmin)
    if (!organisationId) {
      setHasAccess(false)
      return
    }

    // Check feature access via API
    const checkFeatureAccess = async () => {
      try {
        const result = await checkAccess({
          featureCode,
          organisationId,
        }).unwrap()

        setHasAccess(result.data.hasAccess)
        if (!result.data.hasAccess && result.data.reason) {
          setError(result.data.reason)
        }
      } catch (err) {
        setHasAccess(false)
        setError(
          err && typeof err === "object" && "message" in err
            ? (err as { message?: string }).message || "Failed to check feature access"
            : "Failed to check feature access"
        )
      }
    }

    checkFeatureAccess()
  }, [featureCode, organisationId, isFree, isMasterAdminUser, checkAccess])

  return {
    hasAccess,
    isLoading,
    subscription,
    error,
  }
}
