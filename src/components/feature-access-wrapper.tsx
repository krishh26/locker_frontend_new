"use client"

/**
 * Wrapper for feature-gated content. Feature Control module removed;
 * always renders children (no access check).
 */
export function FeatureAccessWrapper({
  children,
}: {
  featureCode?: string
  isFree?: boolean
  children: React.ReactNode
}) {
  return <>{children}</>
}
