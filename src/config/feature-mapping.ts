/**
 * Feature mapping configuration
 * Maps routes/menu items to feature codes and defines free features
 */

/**
 * Map of routes to feature codes
 * When a menu item has a route, we can look up its feature code here
 */
export const FEATURE_MAPPING: Record<string, string> = {
  // Example mappings - update based on your actual routes
  '/advanced-reports': 'ADVANCED_REPORTS',
  '/api-access': 'API_ACCESS',
  '/premium-features': 'PREMIUM_FEATURES',
  '/custom-integrations': 'CUSTOM_INTEGRATIONS',
  '/priority-support': 'PRIORITY_SUPPORT',
  '/analytics': 'ANALYTICS',
  '/export-data': 'EXPORT_DATA',
  '/bulk-operations': 'BULK_OPERATIONS',
}

/**
 * List of feature codes that are always free (visible to all users)
 * These features don't require a subscription
 */
export const FREE_FEATURES = [
  'DASHBOARD',
  'PROFILE',
  'SETTINGS',
  'BASIC_FEATURES',
  // Add more free features as needed
]

/**
 * Get feature code for a given route
 * 
 * @param route - The route path (e.g., '/advanced-reports')
 * @returns Feature code or null if not found
 */
export function getFeatureCodeForRoute(route: string): string | null {
  return FEATURE_MAPPING[route] || null
}

/**
 * Check if a feature is free (always available)
 * 
 * @param featureCode - The feature code to check
 * @returns true if feature is free, false otherwise
 */
export function isFeatureFree(featureCode: string): boolean {
  return FREE_FEATURES.includes(featureCode)
}
