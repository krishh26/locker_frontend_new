/**
 * Type definitions for Payment API responses
 * These match the expected backend response structure
 */

export interface Payment {
  id: number
  date: string
  organisationId: number
  amount: number
  status: string
  invoiceNumber?: string
  paymentMethod?: string
}

export interface PaymentListResponse {
  status: boolean
  message?: string
  data: Payment[]
}

export interface PaymentResponse {
  status: boolean
  message?: string
  data: Payment
}
