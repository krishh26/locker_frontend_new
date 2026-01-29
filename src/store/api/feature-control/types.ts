/**
 * Type definitions for Feature Control API responses
 * Based on CSV: Feature Control Module (7 APIs)
 */

export enum FeatureType {
  Limit = 'limit',
  Toggle = 'toggle',
  Usage = 'usage'
}

export interface Feature {
  id: number
  name: string
  code: string
  description?: string
  type?: FeatureType
  isActive: boolean
  limits?: {
    maxUsers?: number
    maxCentres?: number
    maxOrganisations?: number
    [key: string]: number | undefined
  }
}

export interface FeatureResponse {
  status: boolean
  message?: string
  data: Feature
}

export interface FeatureListResponse {
  status: boolean
  message?: string
  data: Feature[]
}

export interface CreateFeatureRequest {
  name: string
  code: string
  description?: string
  type?: FeatureType
  limits?: {
    maxUsers?: number
    maxCentres?: number
    maxOrganisations?: number
    [key: string]: number | undefined
  }
}

export interface UpdateFeatureLimitsRequest {
  featureId: number
  limits: {
    maxUsers?: number
    maxCentres?: number
    maxOrganisations?: number
    [key: string]: number | undefined
  }
}

export interface MapFeatureToPlanRequest {
  featureId: number
  planId: number
  enabled: boolean
}

export interface CheckFeatureAccessRequest {
  featureCode: string
  organisationId?: number
  centreId?: number
}

export interface CheckFeatureAccessResponse {
  status: boolean
  message?: string
  data: {
    hasAccess: boolean
    reason?: string
    currentUsage?: number
    limit?: number
  }
}

export interface CheckUsageCountRequest {
  featureCode: string
  organisationId?: number
  centreId?: number
}

export interface CheckUsageCountResponse {
  status: boolean
  message?: string
  data: {
    currentUsage: number
    limit?: number
    isWithinLimit: boolean
  }
}

export interface EnableReadOnlyModeRequest {
  organisationId: number
  enabled: boolean
  reason?: string
}
