'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import {
  useCreateLearnerPlanMutation,
  useUpdateSessionMutation,
} from '@/store/api/learner-plan/learnerPlanApi'
import type { LearningPlanSession } from '@/store/api/learner-plan/types'
import { toast } from 'sonner'

type AddSessionFormValues = {
  title: string
  description?: string
  location: string
  startDate: string
  Duration: string
  type: string
}

const SESSION_TYPES = [
  'General',
  'Induction',
  'Formal Review',
  'Telephone',
  'Exit Session',
  'Out Of the Workplace',
  'Tests/Exams',
  'Learner Support',
  'Initial Session',
  'Gateway Ready',
  'EPA',
  'Furloughed',
]

export interface AddSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  learnerId: number
  assessorId: number
  defaultCourseIds: number[]
  onSuccess?: () => void
  isEditMode?: boolean
  sessionToEdit?: LearningPlanSession | null
}

export function AddSessionDialog({
  open,
  onOpenChange,
  learnerId,
  assessorId,
  defaultCourseIds,
  onSuccess,
  isEditMode = false,
  sessionToEdit = null,
}: AddSessionDialogProps) {
  const t = useTranslations('learningPlan')
  const [createLearnerPlan, { isLoading: isCreating }] = useCreateLearnerPlanMutation()
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation()

  const addSessionSchema = React.useMemo(
    () =>
      z.object({
        title: z.string().min(1, t('dialogs.addSession.validation.titleRequired')),
        description: z.string().optional(),
        location: z.string().min(1, t('dialogs.addSession.validation.locationRequired')),
        startDate: z.string().min(1, t('dialogs.addSession.validation.startDateRequired')),
        Duration: z.string().min(1, t('dialogs.addSession.validation.durationRequired')),
        type: z.string().min(1, t('dialogs.addSession.validation.sessionTypeRequired')),
      }),
    [t]
  )

  const form = useForm<AddSessionFormValues>({
    resolver: zodResolver(addSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      startDate: '',
      Duration: '0:30',
      type: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (isEditMode && sessionToEdit) {
        const parsedStartDate = sessionToEdit.startDate
          ? new Date(sessionToEdit.startDate)
          : null
        const startDateValue =
          parsedStartDate && !Number.isNaN(parsedStartDate.getTime())
            ? format(parsedStartDate, "yyyy-MM-dd'T'HH:mm")
            : ''
        form.reset({
          title: sessionToEdit.title || '',
          description: sessionToEdit.description || '',
          location: sessionToEdit.location || '',
          startDate: startDateValue,
          Duration: sessionToEdit.Duration || '0:30',
          type: sessionToEdit.type || '',
        })
        return
      }

      form.reset({
        title: '',
        description: '',
        location: '',
        startDate: '',
        Duration: '0:30',
        type: '',
      })
    }
  }, [open, form, isEditMode, sessionToEdit])

  const durationParts = form.watch('Duration').split(':')
  const hours = parseInt(durationParts[0] || '0', 10)
  const minutes = parseInt(durationParts[1] || '0', 10)

  const handleDurationChange = (kind: 'hours' | 'minutes', value: number) => {
    const current = form.getValues('Duration')
    const parts = current.split(':')
    const currentHours = parseInt(parts[0] || '0', 10)
    const currentMinutes = parseInt(parts[1] || '0', 10)
    if (kind === 'hours') {
      if (value < 0 || value > 23) return
      form.setValue('Duration', `${value}:${currentMinutes}`, { shouldValidate: true })
    } else {
      if (value < 0 || value > 59) return
      form.setValue('Duration', `${currentHours}:${value}`, { shouldValidate: true })
    }
  }

  const onSubmit = async (values: AddSessionFormValues) => {
    const isSubmittingEdit = isEditMode && Boolean(sessionToEdit?.learner_plan_id)

    if (isSubmittingEdit) {
      try {
        await updateSession({
          id: sessionToEdit!.learner_plan_id,
          title: values.title,
          description: values.description || undefined,
          location: values.location,
          startDate: values.startDate,
          Duration: values.Duration,
          type: values.type,
        }).unwrap()
        toast.success('Session updated successfully')
        onOpenChange(false)
        onSuccess?.()
      } catch (error: unknown) {
        const message =
          (error as { data?: { message?: string }; message?: string })?.data?.message ??
          (error as Error)?.message ??
          'Failed to update session'
        toast.error(message)
      }
      return
    }

    if (defaultCourseIds.length === 0) {
      toast.error(t('dialogs.addSession.toast.courseRequired'))
      return
    }
    try {
      await createLearnerPlan({
        assessor_id: assessorId,
        participants: [{ learner_id: learnerId, courses: defaultCourseIds }],
        title: values.title,
        description: values.description || undefined,
        location: values.location,
        startDate: values.startDate,
        Duration: values.Duration,
        type: values.type,
      }).unwrap()
      toast.success(t('dialogs.addSession.toast.success'))
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string }; message?: string })?.data?.message ??
        (error as Error)?.message ??
        t('dialogs.addSession.toast.failed')
      toast.error(message)
    }
  }

  const handleClose = () => {
    if (!isCreating && !isUpdating) {
      form.reset()
      onOpenChange(false)
    }
  }

  const canSubmit = isEditMode || defaultCourseIds.length > 0
  const isSubmitting = isCreating || isUpdating

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Session' : t('dialogs.addSession.title')}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update this session details'
              : t('dialogs.addSession.description')}
          </DialogDescription>
        </DialogHeader>

        {!canSubmit && (
          <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-2 rounded">
            {t('dialogs.addSession.courseContextWarning')}
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              {t('dialogs.addSession.fields.title')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t('dialogs.addSession.placeholders.title')}
              {...form.register('title')}
              disabled={!canSubmit}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('dialogs.addSession.fields.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('dialogs.addSession.placeholders.description')}
              rows={2}
              className="resize-none"
              {...form.register('description')}
              disabled={!canSubmit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              {t('dialogs.addSession.fields.location')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              placeholder={t('dialogs.addSession.placeholders.location')}
              {...form.register('location')}
              disabled={!canSubmit}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              {t('dialogs.addSession.fields.startDateTime')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...form.register('startDate')}
              disabled={!canSubmit}
            />
            {form.formState.errors.startDate && (
              <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('dialogs.addSession.fields.duration')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => handleDurationChange('hours', parseInt(e.target.value, 10) || 0)}
                disabled={!canSubmit}
                className="w-20"
              />
              <span>:</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) =>
                  handleDurationChange('minutes', parseInt(e.target.value, 10) || 0)
                }
                disabled={!canSubmit}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              {t('dialogs.addSession.fields.sessionType')} <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!canSubmit}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t('dialogs.addSession.placeholders.sessionType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((sessionType) => (
                      <SelectItem key={sessionType} value={sessionType}>
                        {sessionType === 'General'
                          ? t('options.sessionTypes.general')
                          : sessionType === 'Induction'
                          ? t('options.sessionTypes.induction')
                          : sessionType === 'Formal Review'
                          ? t('options.sessionTypes.formalReview')
                          : sessionType === 'Telephone'
                          ? t('options.sessionTypes.telephone')
                          : sessionType === 'Exit Session'
                          ? t('options.sessionTypes.exitSession')
                          : sessionType === 'Out Of the Workplace'
                          ? t('options.sessionTypes.outOfTheWorkplace')
                          : sessionType === 'Tests/Exams'
                          ? t('options.sessionTypes.testsExams')
                          : sessionType === 'Learner Support'
                          ? t('options.sessionTypes.learnerSupport')
                          : sessionType === 'Initial Session'
                          ? t('options.sessionTypes.initialSession')
                          : sessionType === 'Gateway Ready'
                          ? t('options.sessionTypes.gatewayReady')
                          : sessionType === 'EPA'
                          ? t('options.sessionTypes.epa')
                          : sessionType === 'Furloughed'
                          ? t('options.sessionTypes.furloughed')
                          : sessionType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.type && (
              <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('dialogs.addSession.buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('dialogs.addSession.buttons.submitting')}
                </>
              ) : (
                isEditMode ? 'Update Session' : t('dialogs.addSession.buttons.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
