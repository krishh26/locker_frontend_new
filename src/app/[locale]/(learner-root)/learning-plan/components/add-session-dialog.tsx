'use client'

import * as React from 'react'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateLearnerPlanMutation } from '@/store/api/learner-plan/learnerPlanApi'
import { toast } from 'sonner'

const addSessionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  Duration: z.string().min(1, 'Duration is required'),
  type: z.string().min(1, 'Session type is required'),
})

type AddSessionFormValues = z.infer<typeof addSessionSchema>

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
}

export function AddSessionDialog({
  open,
  onOpenChange,
  learnerId,
  assessorId,
  defaultCourseIds,
  onSuccess,
}: AddSessionDialogProps) {
  const [createLearnerPlan, { isLoading: isCreating }] = useCreateLearnerPlanMutation()

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
      form.reset({
        title: '',
        description: '',
        location: '',
        startDate: '',
        Duration: '0:30',
        type: '',
      })
    }
  }, [open, form])

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
    if (defaultCourseIds.length === 0) {
      toast.error('At least one course is required. Open Learning Plan from a course to add a session.')
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
      toast.success('Session added successfully')
      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const message =
        (error as { data?: { message?: string }; message?: string })?.data?.message ??
        (error as Error)?.message ??
        'Failed to add session'
      toast.error(message)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      form.reset()
      onOpenChange(false)
    }
  }

  const canSubmit = defaultCourseIds.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
          <DialogDescription>
            Create a new session for this learner. Start date and duration are required.
          </DialogDescription>
        </DialogHeader>

        {!canSubmit && (
          <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 p-2 rounded">
            Open Learning Plan from a course page to add a session (course context is required).
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Session title"
              {...form.register('title')}
              disabled={!canSubmit}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              rows={2}
              className="resize-none"
              {...form.register('description')}
              disabled={!canSubmit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              Location <span className="text-destructive">*</span>
            </Label>
            <Input
              id="location"
              placeholder="e.g. Room 1, Online"
              {...form.register('location')}
              disabled={!canSubmit}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              Start date & time <span className="text-destructive">*</span>
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
            <Label>Duration (hours:minutes)</Label>
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
              Session type <span className="text-destructive">*</span>
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
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !canSubmit}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
