'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  useGetContractedWorkByLearnerQuery,
  useCreateContractedWorkMutation,
  useUpdateContractedWorkMutation,
  useDeleteContractedWorkMutation,
} from '@/store/api/contracted-work/contractedWorkApi'
import { useGetEmployersQuery } from '@/store/api/employer/employerApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ContractedWork } from '@/store/api/contracted-work/types'
import { useAppSelector } from '@/store/hooks'
import { selectAuthUser } from '@/store/slices/authSlice'

interface ContractedWorkHoursTabProps {
  learnerId: number
  canEdit?: boolean
}

/** Radix Select cannot use empty string as value; map to this sentinel in the UI only. */
const COMPANY_PLACEHOLDER_VALUE = '__contracted_work_company_none__'

function getContractedWorkSchema(t: (key: string) => string) {
  return z.object({
    company: z
      .string()
      .min(1, t('contractedWorkHours.validation.companyRequired'))
      .refine((val) => val !== COMPANY_PLACEHOLDER_VALUE, {
        message: t('contractedWorkHours.validation.companyRequired'),
      }),
    contract_start: z.date({
      message: t('contractedWorkHours.validation.contractStartRequired'),
    }),
    contract_end: z.date().optional().nullable(),
    contracted_work_hours_per_week: z
      .string()
      .min(1, t('contractedWorkHours.validation.hoursRequired'))
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        t('contractedWorkHours.validation.hoursPositive'),
      ),
  })
}

type ContractedWorkFormValues = z.infer<
  ReturnType<typeof getContractedWorkSchema>
>

export function ContractedWorkHoursTab({
  learnerId,
  canEdit = false,
}: ContractedWorkHoursTabProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const t = useTranslations('learnerProfile')
  const authUser = useAppSelector(selectAuthUser)
  const contractedWorkSchema = useMemo(
    () => getContractedWorkSchema((key) => t(key)),
    [t],
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedWork, setSelectedWork] = useState<ContractedWork | null>(null)

  const {
    data: contractedWorkResponse,
    isLoading,
    refetch,
  } = useGetContractedWorkByLearnerQuery(learnerId)

  const [createContractedWork, { isLoading: isCreating }] =
    useCreateContractedWorkMutation()
  const [updateContractedWork, { isLoading: isUpdating }] =
    useUpdateContractedWorkMutation()
  const [deleteContractedWork, { isLoading: isDeleting }] =
    useDeleteContractedWorkMutation()

  const { data: employersData, isLoading: isLoadingEmployers } =
    useGetEmployersQuery({ page: 1, page_size: 1000 }, { skip: !dialogOpen })

  const contractedWorkList = contractedWorkResponse?.data || []

  const companySelectOptions = useMemo(() => {
    const rows = employersData?.data ?? []
    const namesInList = new Set(rows.map((e) => e.employer_name))
    const legacy =
      selectedWork?.company &&
      selectedWork.company.trim() !== '' &&
      !namesInList.has(selectedWork.company)
        ? selectedWork.company
        : null

    const options: { key: string; label: string; value: string }[] = []
    if (legacy) {
      options.push({
        key: `legacy:${legacy}`,
        label: legacy,
        value: legacy,
      })
    }

    const seenValues = new Set<string>()
    if (legacy) seenValues.add(legacy)

    for (const e of rows) {
      if (seenValues.has(e.employer_name)) continue
      seenValues.add(e.employer_name)
      options.push({
        key: String(e.employer_id),
        label: e.employer_name,
        value: e.employer_name,
      })
    }

    return options
  }, [employersData?.data, selectedWork?.company])

  const form = useForm<ContractedWorkFormValues>({
    resolver: zodResolver(contractedWorkSchema),
    defaultValues: {
      company: '',
      contract_start: undefined,
      contract_end: null,
      contracted_work_hours_per_week: '',
    },
  })

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch {
      return date
    }
  }

  const formatEditorName = (
    editor: { first_name: string; last_name: string } | null | undefined,
  ): string => {
    if (!editor) return '-'
    return `${editor.first_name} ${editor.last_name}`
  }

  const handleOpenDialog = (work?: ContractedWork) => {
    // Always clear selectedWork first to prevent stale state
    setSelectedWork(null)

    if (work) {
      setSelectedWork(work)
      form.reset({
        company: work.company,
        contract_start: new Date(work.contract_start),
        contract_end: work.contract_end ? new Date(work.contract_end) : null,
        contracted_work_hours_per_week: String(
          work.contracted_work_hours_per_week,
        ),
      })
    } else {
      // Explicitly reset form for create mode
      form.reset({
        company: '',
        contract_start: undefined,
        contract_end: null,
        contracted_work_hours_per_week: '',
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    // Clear selectedWork immediately when closing
    setSelectedWork(null)
    // Reset form to default values
    form.reset({
      company: '',
      contract_start: undefined,
      contract_end: null,
      contracted_work_hours_per_week: '',
    })
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const rawEditorId =
        authUser &&
        (typeof authUser.user_id === 'number'
          ? authUser.user_id
          : typeof authUser.user_id === 'string'
            ? Number(authUser.user_id)
            : undefined)
      const lastEditorId =
        rawEditorId != null && !Number.isNaN(rawEditorId)
          ? rawEditorId
          : authUser?.id != null
            ? Number(authUser.id)
            : undefined

      const payload = {
        learner_id: learnerId,
        company: data.company,
        contract_start: data.contract_start.toISOString(),
        contract_end: data.contract_end?.toISOString() || null,
        contracted_work_hours_per_week: Number(
          data.contracted_work_hours_per_week,
        ),
        ...(lastEditorId != null && !Number.isNaN(lastEditorId)
          ? { last_editer: lastEditorId }
          : {}),
        yearly_holiday_entitlement_in_hours: 0,
      }

      if (selectedWork) {
        await updateContractedWork({
          id: selectedWork.id,
          data: payload,
        }).unwrap()
        toast.success(t('contractedWorkHours.toast.updated'))
      } else {
        await createContractedWork(payload).unwrap()
        toast.success(t('contractedWorkHours.toast.created'))
      }

      handleCloseDialog()
      refetch()
    } catch (error) {
      console.error('Failed to save contracted work hours:', error)
      toast.error(t('contractedWorkHours.toast.saveFailed'))
    }
  })

  const handleDelete = async () => {
    if (!selectedWork) return

    try {
      await deleteContractedWork(selectedWork.id).unwrap()
      toast.success(t('contractedWorkHours.toast.deleted'))
      setDeleteDialogOpen(false)
      setSelectedWork(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete contracted work hours:', error)
      toast.error(t('contractedWorkHours.toast.deleteFailed'))
    }
  }

  const handleDeleteClick = (work: ContractedWork) => {
    setSelectedWork(work)
    setDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className='py-8'>
          <div className='text-center text-muted-foreground'>
            {t('contractedWorkHours.loading')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle>{t('contractedWorkHours.cardTitle')}</CardTitle>
          {canEdit && (
            <Button type='button' onClick={() => handleOpenDialog()} size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              {t('contractedWorkHours.setNewHours')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {contractedWorkList.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {t('contractedWorkHours.emptyState')}
            </div>
          ) : (
            <div className='rounded-md border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('contractedWorkHours.table.company')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.contractStart')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.contractEnd')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.hoursPerWeek')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.yearlyHoliday')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.lastEditedBy')}
                    </TableHead>
                    <TableHead>
                      {t('contractedWorkHours.table.lastEditedDate')}
                    </TableHead>
                    {canEdit && (
                      <TableHead>
                        {t('contractedWorkHours.table.actions')}
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractedWorkList.map((work) => (
                    <TableRow key={work.id}>
                      <TableCell className='font-medium'>
                        {work.company}
                      </TableCell>
                      <TableCell>{formatDate(work.contract_start)}</TableCell>
                      <TableCell>{formatDate(work.contract_end)}</TableCell>
                      <TableCell>
                        {work.contracted_work_hours_per_week}
                      </TableCell>
                      <TableCell>
                        {work.yearly_holiday_entitlement_in_hours ?? '-'}
                      </TableCell>
                      <TableCell>
                        {formatEditorName(work.last_editer)}
                      </TableCell>
                      <TableCell>{formatDate(work.updated_at)}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => handleOpenDialog(work)}
                              className='h-8 w-8'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              onClick={() => handleDeleteClick(work)}
                              className='h-8 w-8 text-destructive hover:text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {contractedWorkList.length > 0 && (
            <div className='mt-6 p-4 bg-muted/50 rounded-md'>
              <p className='text-sm text-muted-foreground'>
                {t('contractedWorkHours.noteText')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          }
        }}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {selectedWork
                ? t('contractedWorkHours.dialog.editTitle')
                : t('contractedWorkHours.dialog.setNewTitle')}
            </DialogTitle>
            <DialogDescription>
              {selectedWork
                ? t('contractedWorkHours.dialog.editDescription')
                : t('contractedWorkHours.dialog.setNewDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} className='space-y-4'>
              <FormField
                control={form.control}
                name='company'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('contractedWorkHours.dialog.companyLabel')}
                    </FormLabel>
                    <Select
                      value={
                        field.value && field.value.trim() !== ''
                          ? field.value
                          : COMPANY_PLACEHOLDER_VALUE
                      }
                      onValueChange={(v) =>
                        field.onChange(v === COMPANY_PLACEHOLDER_VALUE ? '' : v)
                      }
                      disabled={isLoadingEmployers}
                    >
                      <FormControl className='w-full'>
                        <SelectTrigger
                          className={
                            form.formState.errors.company
                              ? 'border-destructive'
                              : ''
                          }
                        >
                          <SelectValue
                            placeholder={t(
                              'contractedWorkHours.dialog.companyPlaceholder',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={COMPANY_PLACEHOLDER_VALUE}>
                          {t('contractedWorkHours.dialog.companyPlaceholder')}
                        </SelectItem>
                        {companySelectOptions.map((opt) => (
                          <SelectItem key={opt.key} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingEmployers && (
                      <p className='text-sm text-muted-foreground'>
                        {t('contractedWorkHours.dialog.loadingEmployers')}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contract_start'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      {t('contractedWorkHours.dialog.contractStartLabel')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>
                                {t('contractedWorkHours.dialog.pickDate')}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < today}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contract_end'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>
                      {t('contractedWorkHours.dialog.contractEndLabel')}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>
                                {t(
                                  'contractedWorkHours.dialog.pickDateOptional',
                                )}
                              </span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={field.value || undefined}
                          onSelect={(date) => field.onChange(date || null)}
                          captionLayout='dropdown'
                          fromYear={1900}
                          toYear={new Date().getFullYear() + 20}
                          disabled={(date) => date < today}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='contracted_work_hours_per_week'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('contractedWorkHours.dialog.hoursPerWeekLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder={t(
                          'contractedWorkHours.dialog.hoursPlaceholder',
                        )}
                        {...field}
                        min='0'
                        step='0.5'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleCloseDialog}
                  disabled={isCreating || isUpdating || isLoadingEmployers}
                >
                  {t('contractedWorkHours.dialog.cancel')}
                </Button>
                <Button
                  type='submit'
                  disabled={isCreating || isUpdating || isLoadingEmployers}
                >
                  {(isCreating || isUpdating) && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {selectedWork
                    ? t('contractedWorkHours.dialog.update')
                    : t('contractedWorkHours.dialog.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('contractedWorkHours.deleteDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('contractedWorkHours.deleteDialog.description', {
                company: selectedWork?.company ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedWork(null)
              }}
              disabled={isDeleting}
            >
              {t('contractedWorkHours.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {t('contractedWorkHours.deleteDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
