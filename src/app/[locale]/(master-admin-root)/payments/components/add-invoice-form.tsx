'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useGetPaymentQuery,
} from '@/store/api/payments/paymentApi'
import type {
  CreatePaymentRequest,
  PaymentLineItem,
  PaymentStatus,
} from '@/store/api/payments/types'
import {
  useGetPlansQuery,
  useGetSubscriptionQuery,
} from '@/store/api/subscriptions/subscriptionApi'
import { useGetOrganisationsQuery } from '@/store/api/organisations/organisationApi'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { exportInvoiceToPdf } from '@/utils/pdfExport'

function getDefaultDueDateForMonth(offsetMonths: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths)
  return d.toISOString().split('T')[0]
}

/** Given YYYY-MM-DD, return same date + 1 month as YYYY-MM-DD (preserves day, e.g. Mar 6 → Apr 6) */
function addOneMonth(dateStr: string): string {
  const [y, m, day] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  d.setMonth(d.getMonth() + 1)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export interface AddInvoiceFormProps {
  paymentId?: number
}

export function AddInvoiceForm({ paymentId }: AddInvoiceFormProps) {
  const router = useRouter()
  const { data: orgsData, isLoading: isLoadingOrgs } = useGetOrganisationsQuery(
    {
      status: 'active',
      page: 1,
      limit: 500,
      meta: 'true',
    }
  )
  const { data: plansData, isLoading: isLoadingPlans } = useGetPlansQuery()
  const { data: paymentData, isLoading: isLoadingPayment } = useGetPaymentQuery(
    paymentId ?? 0,
    { skip: !paymentId }
  )
  const [createPaymentMutation, { isLoading: isCreating }] =
    useCreatePaymentMutation()
  const [updatePaymentMutation, { isLoading: isUpdating }] =
    useUpdatePaymentMutation()
  const isSubmitting = isCreating || isUpdating

  const [organisationId, setOrganisationId] = useState<string>('')
  const [planId, setPlanId] = useState<string>('')
  const [invoiceDate, setInvoiceDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  )
  const [currency, setCurrency] = useState<string>('GBP')
  const [status, setStatus] = useState<PaymentStatus>('draft')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [lineItems, setLineItems] = useState<PaymentLineItem[]>([])
  const [hasPopulatedFromPayment, setHasPopulatedFromPayment] = useState(false)

  // Populate form when editing an existing payment
  useEffect(() => {
    if (!paymentId || !paymentData?.data || hasPopulatedFromPayment) return
    const p = paymentData.data
    setOrganisationId(String(p.organisationId))
    setPlanId(p.planId != null ? String(p.planId) : '')
    setInvoiceDate(p.date.includes('T') ? p.date.split('T')[0] : p.date)
    setCurrency(p.currency ?? 'GBP')
    setStatus(
        (['draft', 'sent', 'failed', 'refunded'].includes(p.status)
          ? p.status
          : 'draft') as PaymentStatus
      )
    setPaymentMethod(p.paymentMethod ?? '')
    setNotes(p.notes ?? '')
    const items = (p.lineItems ?? []).map((item, i) => ({
      periodIndex: item.periodIndex ?? i + 1,
      periodLabel: item.periodLabel ?? `Month ${i + 1}`,
      dueDate: item.dueDate,
      amount: item.amount ?? 0,
      discountPercent: item.discountPercent ?? null,
      taxPercent: item.taxPercent ?? null,
      status: (item.status ?? 'pending') as 'pending' | 'paid',
      paidDate: item.paidDate,
    }))
    setLineItems(items)
    setHasPopulatedFromPayment(true)
  }, [paymentId, paymentData?.data, hasPopulatedFromPayment])

  // Reset populated flag when paymentId changes so we re-populate for a different payment
  useEffect(() => {
    setHasPopulatedFromPayment(false)
  }, [paymentId])

  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    useGetSubscriptionQuery(Number(organisationId) || 0, {
      skip: !organisationId,
    })

  const organisations = orgsData?.data ?? []
  const allPlans = (plansData?.data ?? []).filter((p) => p.isActive)
  const assignedPlanName = subscriptionData?.data?.plan ?? ''
  
  // When editing, include the payment's plan in available options even if subscription changed
  const editingPlanId = paymentData?.data?.planId
  const plans = useMemo(() => {
    if (!organisationId) return []
    
    // When editing, always include the current payment's plan
    if (paymentId && editingPlanId) {
      const editingPlan = allPlans.find((p) => p.id === editingPlanId)
      const subscriptionPlans = assignedPlanName 
        ? allPlans.filter((p) => p.name === assignedPlanName)
        : []
      
      // Combine: subscription plans + editing plan (avoid duplicates)
      const combined = [...subscriptionPlans]
      if (editingPlan && !combined.find((p) => p.id === editingPlan.id)) {
        combined.push(editingPlan)
      }
      return combined.length > 0 ? combined : allPlans
    }
    
    if (!assignedPlanName) return []
    return allPlans.filter((p) => p.name === assignedPlanName)
  }, [organisationId, assignedPlanName, allPlans, paymentId, editingPlanId])
  const selectedPlan =
    plans.find((p) => String(p.id) === planId) ??
    allPlans.find((p) => String(p.id) === planId)
  const isYearlyPlan = selectedPlan?.billingCycle === 'yearly'
  const isMonthlyPlan = selectedPlan?.billingCycle === 'monthly'

  const addRow = () => {
    setLineItems((prev) => {
      const nextIndex = prev.length + 1
      let amount = 0
      if (selectedPlan) {
        if (isMonthlyPlan) {
          amount = Math.round(Number(selectedPlan.price) * 100) / 100
        } else if (isYearlyPlan) {
          amount = Math.round((Number(selectedPlan.price) / 12) * 100) / 100
        }
      }
      // New row due date = previous row due date + 1 month (not current date)
      const lastDue = prev.length > 0 ? prev[prev.length - 1].dueDate : null
      const dueDate =
        lastDue && /^\d{4}-\d{2}-\d{2}$/.test(lastDue)
          ? addOneMonth(lastDue)
          : getDefaultDueDateForMonth(nextIndex)
      const newItem: PaymentLineItem = {
        periodIndex: nextIndex,
        periodLabel: `Month ${nextIndex}`,
        dueDate,
        amount,
        discountPercent: null,
        taxPercent: null,
        status: 'pending',
      }
      return [...prev, newItem]
    })
  }

  const removeRow = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, updates: Partial<PaymentLineItem>) => {
    setLineItems((prev) => {
      const next = prev.map((item, i) =>
        i === index ? { ...item, ...updates } : item
      )
      // When due date changes, cascade: each following row = previous due date + 1 month
      const newDueDate = updates.dueDate
      const isValidDate =
        typeof newDueDate === 'string' &&
        newDueDate.trim() !== '' &&
        /^\d{4}-\d{2}-\d{2}$/.test(newDueDate)
      if (isValidDate && index < next.length - 1) {
        let baseDate = newDueDate as string
        return next.map((item, i) => {
          if (i <= index) return item
          baseDate = addOneMonth(baseDate)
          return { ...item, dueDate: baseDate }
        })
      }
      return next
    })
  }

  const handlePlanChange = (newValue: string) => {
    setPlanId(newValue)
    const plan =
      plans.find((p) => String(p.id) === newValue) ??
      allPlans.find((p) => String(p.id) === newValue)
    if (plan?.currency) {
      setCurrency(plan.currency)
    }
    if (plan?.billingCycle === 'yearly' && notes === '') {
      setNotes('Month 1 of 12 - yearly plan')
    }
  }

  /** Per-row: discount amount = amount * (discountPercent/100); tax = (amount - discount) * (taxPercent/100); rowTotal = amount - discount + tax */
  const rowCalculations = useMemo(() => {
    return lineItems.map((item) => {
      const amount = item.amount ?? 0
      const dPct = item.discountPercent ?? null
      const tPct = item.taxPercent ?? null
      const discountAmount = dPct ? (amount * dPct) / 100 : 0
      const amountAfterDiscount = amount - discountAmount
      const taxAmount = tPct ? (amountAfterDiscount * tPct) / 100 : 0
      const rowTotal = Math.round((amountAfterDiscount + taxAmount) * 100) / 100
      return { discountAmount, taxAmount, rowTotal, amountAfterDiscount }
    })
  }, [lineItems])

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0),
    [lineItems]
  )
  const totalDiscount = useMemo(
    () => rowCalculations.reduce((sum, r) => sum + r.discountAmount, 0),
    [rowCalculations]
  )
  const totalTax = useMemo(
    () => rowCalculations.reduce((sum, r) => sum + r.taxAmount, 0),
    [rowCalculations]
  )
  const total = useMemo(
    () =>
      Math.round(
        rowCalculations.reduce((sum, r) => sum + r.rowTotal, 0) * 100
      ) / 100,
    [rowCalculations]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organisationId || !planId) {
      toast.error('Please select organisation and plan')
      return
    }
    if (lineItems.length === 0) {
      toast.error('Please add at least one row')
      return
    }
    const payload: CreatePaymentRequest = {
      organisationId: Number(organisationId),
      planId: Number(planId),
      date: invoiceDate,
      numberOfPeriods: lineItems.length,
      currency,
      status,
      paymentMethod: paymentMethod || undefined,
      notes: notes || undefined,
      lineItems: lineItems.map((item) => ({
        periodIndex: item.periodIndex,
        periodLabel: item.periodLabel,
        dueDate: item.dueDate,
        amount: item.amount,
        discountPercent: item.discountPercent ?? 0,
        taxPercent: item.taxPercent ?? 0,
        status: item.status,
        paidDate: item.paidDate,
      })),
    }
    try {
      let invoiceNumber = ''
      if (paymentId) {
        const response = await updatePaymentMutation({
          id: paymentId,
          data: payload,
        }).unwrap()
        invoiceNumber = response?.data?.invoiceNumber ?? ''
        toast.success('Invoice updated successfully')
      } else {
        const response = await createPaymentMutation(payload).unwrap()
        invoiceNumber = response?.data?.invoiceNumber ?? ''
        toast.success('Invoice created successfully')
      }
      // Auto-generate and download invoice PDF after create
      const orgName =
        organisations.find((o) => String(o.id) === organisationId)?.name ??
        'Unknown'
      const planName = selectedPlan?.name ?? 'Unknown'
      exportInvoiceToPdf({
        organisationName: orgName,
        planName,
        invoiceDate,
        invoiceNumber,
        currency,
        lineItems: lineItems.map((item, i) => ({
          periodLabel: item.periodLabel,
          dueDate: item.dueDate,
          amount: item.amount ?? 0,
          discountPercent: item.discountPercent ?? null,
          taxPercent: item.taxPercent ?? null,
          rowTotal: rowCalculations[i]?.rowTotal ?? 0,
        })),
        subtotal,
        totalDiscount,
        totalTax,
        total,
        notes: notes || undefined,
      })
      router.push('/payments')
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { message?: string } }).data?.message
          : error instanceof Error
          ? error.message
          : paymentId
          ? 'Failed to update invoice'
          : 'Failed to create invoice'
      toast.error(String(msg))
    }
  }

  const isLoading =
    isLoadingOrgs || isLoadingPlans || (!!paymentId && isLoadingPayment)

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-4'>
        <div className='space-y-2'>
          <Label>Invoice date *</Label>
          <Input
            type='date'
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
        </div>
        <div className='space-y-2'>
          <Label>Organisation *</Label>
          <Select
            value={organisationId}
            onValueChange={(v) => {
              setOrganisationId(v)
              // Only clear planId when creating new invoice, not when editing
              if (!paymentId) {
                setPlanId('')
              }
            }}
            required
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select organisation' />
            </SelectTrigger>
            <SelectContent>
              {organisations.map((org) => (
                <SelectItem key={org.id} value={String(org.id)}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label>Plan *</Label>
          <Select
            value={planId}
            onValueChange={handlePlanChange}
            required
            disabled={
              !organisationId || isLoadingSubscription || (plans.length === 0 && !paymentId)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  !organisationId
                    ? 'Select organisation first'
                    : isLoadingSubscription
                    ? 'Loading...'
                    : plans.length === 0 && !paymentId
                    ? 'No plan assigned to this organisation'
                    : 'Select plan'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.id)}>
                  {plan.name} ({plan.currency} {plan.price}/{plan.billingCycle})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='GBP'>GBP</SelectItem>
              <SelectItem value='USD'>USD</SelectItem>
              <SelectItem value='EUR'>EUR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='draft'>Draft</SelectItem>
              <SelectItem value='sent'>Sent</SelectItem>
              <SelectItem value='failed'>Failed</SelectItem>
              <SelectItem value='refunded'>Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <Label>Payment rows</Label>
          <Button type='button' variant='outline' size='sm' onClick={addRow}>
            <Plus className='mr-2 h-4 w-4' />
            Add row
          </Button>
        </div>
        <div className='rounded-md border overflow-x-auto max-h-[320px] overflow-y-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[100px]'>Period</TableHead>
                <TableHead className='w-[100px]'>Due date</TableHead>
                <TableHead className='w-[100px]'>Amount</TableHead>
                <TableHead className='w-[90px]'>Discount (%)</TableHead>
                <TableHead className='w-[80px]'>Tax (%)</TableHead>
                <TableHead className='w-[100px]'>Row total</TableHead>
                <TableHead className='w-[100px]'>Status</TableHead>
                <TableHead className='w-[60px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, index) => (
                <TableRow key={`${item.periodIndex}-${index}`}>
                  <TableCell className='font-medium'>
                    {item.periodLabel}
                  </TableCell>
                  <TableCell>
                    <Input
                      type='date'
                      value={item.dueDate}
                      onChange={(e) =>
                        updateLineItem(index, { dueDate: e.target.value })
                      }
                      className='h-8'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      min={0}
                      step={0.01}
                      value={item.amount}
                      onChange={(e) =>
                        updateLineItem(index, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className='h-8 w-24'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      min={0}
                      max={100}
                      step={1}
                      value={
                        item.discountPercent === 0 ||
                        item.discountPercent == null
                          ? ''
                          : item.discountPercent
                      }
                      onChange={(e) =>
                        updateLineItem(index, {
                          discountPercent:
                            e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      placeholder='0'
                      className='h-8 w-20'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type='number'
                      min={0}
                      step={1}
                      value={
                        item.taxPercent === 0 || item.taxPercent == null
                          ? ''
                          : item.taxPercent
                      }
                      onChange={(e) =>
                        updateLineItem(index, {
                          taxPercent:
                            e.target.value === '' ? 0 : Number(e.target.value),
                        })
                      }
                      placeholder='0'
                      className='h-8 w-20'
                    />
                  </TableCell>
                  <TableCell className='font-medium tabular-nums'>
                    {currency}{' '}
                    {rowCalculations[index]?.rowTotal.toFixed(2) ?? '0.00'}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.status}
                      onValueChange={(v: 'pending' | 'paid') =>
                        updateLineItem(index, { status: v })
                      }
                    >
                      <SelectTrigger className='h-8 w-[200px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='paid'>Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground hover:text-destructive'
                      onClick={() => removeRow(index)}
                      aria-label='Remove row'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {lineItems.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            No payment lines added yet. Click &quot;Add row&quot; to insert a
            payment item for this invoice. The amount for each row will be
            automatically filled based on the selected plan: full price for
            monthly plans, or evenly divided (per month) for yearly plans.
          </p>
        )}
      </div>

      <div className='flex items-end justify-end w-full'>
        <div className='rounded-md border bg-muted/40 p-3 w-1/4 text-sm'>
          <div className='flex justify-between gap-2'>
            <span>Subtotal</span>
            <span>
              {currency} {subtotal.toFixed(2)}
            </span>
          </div>
          {totalDiscount > 0 && (
            <div className='flex justify-between gap-2 text-muted-foreground'>
              <span>Total discount</span>
              <span>
                -{currency} {totalDiscount.toFixed(2)}
              </span>
            </div>
          )}
          {totalTax > 0 && (
            <div className='flex justify-between gap-2 text-muted-foreground'>
              <span>Total tax</span>
              <span>
                +{currency} {totalTax.toFixed(2)}
              </span>
            </div>
          )}
          <div className='flex justify-between gap-2 font-semibold mt-2 pt-2 border-t'>
            <span>Total</span>
            <span>
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label>Payment method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select method' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='bank_transfer'>Bank transfer</SelectItem>
              <SelectItem value='card'>Card</SelectItem>
              <SelectItem value='invoice'>Invoice</SelectItem>
              <SelectItem value='other'>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2 w-1/2'>
        <Label>Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Optional notes'
        />
      </div>

      <div className='flex flex-col-reverse gap-4 border-t pt-4 sm:flex-row sm:justify-end'>
        <Button
          type='button'
          variant='outline'
          onClick={() => router.push('/payments')}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type='submit'
          disabled={
            isSubmitting || !organisationId || !planId || lineItems.length === 0
          }
        >
          {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {paymentId ? 'Update invoice' : 'Create invoice'}
        </Button>
      </div>
    </form>
  )
}
