/**
 * Type definitions for Payment API responses
 * These match the expected backend response structure
 */

/** Invoice/payment status */
export type PaymentStatus = "draft" | "sent" | "failed" | "refunded"

/** Single instalment row (e.g. Month 1, Month 2) for recurring payments */
export interface PaymentLineItem {
  periodIndex: number
  periodLabel: string
  dueDate: string
  amount: number
  /** Discount % for this row only */
  discountPercent?: number | null
  /** Tax % for this row only (applied after discount) */
  taxPercent?: number | null
  status: "pending" | "paid"
  paidDate?: string
}

export interface Payment {
  id: number
  date: string
  organisationId: number
  amount: number
  status: PaymentStatus
  invoiceNumber?: string
  paymentMethod?: string
  /** Plan this payment is for (when backend returns it) */
  planId?: number
  planName?: string
  subtotal?: number
  discountType?: "percentage" | "fixed"
  discountValue?: number
  taxType?: "percentage" | "fixed"
  taxValue?: number
  total?: number
  currency?: string
  notes?: string
  /** Instalment rows when plan has multiple periods */
  lineItems?: PaymentLineItem[]
}

export interface PaymentListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaymentListResponse {
  status: boolean
  message?: string
  data: Payment[]
  meta?: PaymentListMeta
}

export interface PaymentResponse {
  status: boolean
  message?: string
  data: Payment
}

/** Request body for creating an invoice with instalment rows */
export interface CreatePaymentRequest {
  organisationId: number
  planId: number
  date: string
  numberOfPeriods?: number
  currency?: string
  status?: PaymentStatus
  paymentMethod?: string
  notes?: string
  invoiceNumber?: string
  lineItems: Array<{
    periodIndex: number
    periodLabel: string
    dueDate: string
    amount: number
    discountPercent?: number
    taxPercent?: number
    status: "pending" | "paid"
    paidDate?: string
  }>
}

/** Request body for updating an invoice (same shape as create for full replace) */
export type UpdatePaymentRequest = CreatePaymentRequest
