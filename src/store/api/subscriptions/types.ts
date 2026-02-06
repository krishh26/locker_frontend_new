/**
 * Type definitions for Subscription API responses
 * Based on CSV: Subscription Module (9 APIs)
 */

export interface Subscription {
  id: number
  organisationId: number
  plan: string
  usedUsers: number
  userLimit: number
  isExpired: boolean
  expiryDate: string
}

export interface SubscriptionResponse {
  status: boolean
  message?: string
  data: Subscription
}

export interface SubscriptionListResponse {
  status: boolean
  message?: string
  data: Subscription[]
}

// Plan-related types
export interface Plan {
  id: number
  name: string
  code: string
  description?: string
  price: number
  currency: string
  billingCycle: "monthly" | "yearly"
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  features: string[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PlanResponse {
  status: boolean
  message?: string
  data: Plan
}

export interface PlanListResponse {
  status: boolean
  message?: string
  data: Plan[]
}

export interface CreatePlanRequest {
  name: string
  code: string
  description?: string
  price: number
  currency: string
  billingCycle: "monthly" | "yearly"
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  features: string[]
}

export interface UpdatePlanRequest {
  name?: string
  description?: string
  price?: number
  currency?: string
  billingCycle?: "monthly" | "yearly"
  userLimit?: number
  centreLimit?: number
  organisationLimit?: number
  features?: string[]
}

export interface AssignPlanToOrganisationRequest {
  organisationId: number
  planId: number
}

export interface ChangeOrganisationPlanRequest {
  organisationId: number
  planId: number
}

export interface SuspendOrganisationAccessRequest {
  organisationId: number
  reason?: string
}
