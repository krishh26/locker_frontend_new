import { LucideIcon } from "lucide-react"
import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectAuthUser } from "@/store/slices/authSlice"
import { isMasterAdmin } from "@/utils/permissions"
import { isFeatureFree } from "@/config/feature-mapping"

type SidebarItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: SidebarItem[]
  featureCode?: string  // Feature code required for subscription-based access
  isFree?: boolean      // If true, always visible regardless of subscription
}

/**
 * Extract all unique feature codes from sidebar items
 */
function extractFeatureCodes(items: SidebarItem[]): string[] {
  const codes = new Set<string>()
  
  const traverse = (items: SidebarItem[]) => {
    for (const item of items) {
      if (item.featureCode) {
        codes.add(item.featureCode)
      }
      if (item.items) {
        traverse(item.items)
      }
    }
  }
  
  traverse(items)
  return Array.from(codes)
}

/**
 * Hook to check access for multiple features at once
 * Returns a map of feature code to access status
 * 
 * IMPORTANT: This hook requires all feature codes to be known at render time.
 * You cannot use hooks in a loop, so we use a component-based approach internally.
 * 
 * Usage:
 * ```tsx
 * const accessMap = useFeatureAccessMap(sidebarItems)
 * const hasAccess = accessMap.get('FEATURE_CODE') ?? false
 * ```
 * 
 * Note: This may cause multiple API calls (one per feature).
 * For better performance, consider implementing a batch check endpoint.
 */
export function useFeatureAccessMap(items: SidebarItem[]): Map<string, boolean> {
  const user = useAppSelector(selectAuthUser)
  const featureCodes = useMemo(() => extractFeatureCodes(items), [items])
  const isMasterAdminUser = isMasterAdmin(user)
  
  // Create a map to store access results
  const accessMap = useMemo(() => {
    const map = new Map<string, boolean>()
    
    // MasterAdmin has access to all features
    if (isMasterAdminUser) {
      featureCodes.forEach(code => map.set(code, true))
      return map
    }
    
    // Initialize map with default values
    featureCodes.forEach(code => {
      // Free features are always accessible
      if (isFeatureFree(code)) {
        map.set(code, true)
      } else {
        // Will be set by individual useFeatureAccess calls below
        map.set(code, false)
      }
    })
    
    return map
  }, [featureCodes, isMasterAdminUser])
  
  // Check access for each feature using individual hooks
  // Note: We need to call hooks for each feature code, but we can't do it in a loop
  // So we'll use a helper component pattern or check them individually
  // For now, return the map - actual checking happens in FeatureAccessWrapper
  
  return accessMap
}

/**
 * NOTE: This hook is NOT currently used in the implementation.
 * 
 * The current implementation uses FeatureAccessWrapper component instead,
 * which wraps each menu item individually and checks access on-demand.
 * 
 * This hook only extracts feature codes and sets defaults (free features, MasterAdmin).
 * It does NOT make API calls to check feature access.
 * 
 * If you need batch checking, you would need to:
 * 1. Create a backend batch endpoint (e.g., POST /feature-control/check-access-batch)
 * 2. Use that endpoint in this hook
 * 3. Or use FeatureAccessWrapper for each item (current approach - recommended)
 */
