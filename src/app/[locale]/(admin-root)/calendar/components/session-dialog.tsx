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
import { format } from 'date-fns'
import { useCachedUsersByRole } from '@/store/hooks/useCachedUsersByRole'
import { useCachedLearnersList } from '@/store/hooks/useCachedLearnersList'
import {
  useCreateSessionMutation,
  useUpdateSessionMutation,
} from '@/store/api/session/sessionApi'
import type { Session } from '@/store/api/session/types'
import { toast } from 'sonner'
import MultipleSelector, { type Option } from '@/components/ui/multi-select'

const sessionSchema = z.object({
  trainer_id: z.string().min(1, 'Trainer is required'),
  learners: z.array(z.string()).min(1, 'At least one learner is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  Duration: z.string().min(1, 'Duration is required'),
  type: z.string().min(1, 'Session type is required'),
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface SessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session?: Session | null
  onSuccess?: () => void
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

export function SessionDialog({
  open,
  onOpenChange,
  session,
  onSuccess,
}: SessionDialogProps) {
  const isEdit = !!session

  const { data: trainersData, isLoading: isTrainersLoading } =
    useCachedUsersByRole('Trainer', { skip: !open })
  const { data: learnersData, isLoading: isLearnersLoading } = useCachedLearnersList({ skip: !open })
  const [createSession, { isLoading: isCreating }] = useCreateSessionMutation()
  const [updateSession, { isLoading: isUpdating }] = useUpdateSessionMutation()

  const isLoading = isCreating || isUpdating

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      trainer_id: '',
      learners: [],
      title: '',
      description: '',
      location: '',
      startDate: '',
      Duration: '0:0',
      type: '',
    },
    mode: 'onChange',
  })

  // Convert learners data to Option format for MultipleSelector
  const learnerOptions: Option[] = React.useMemo(() => {
    return (
      learnersData?.data?.map((learner) => ({
        value: learner.learner_id.toString(),
        label: `${learner.first_name} ${learner.last_name}`,
      })) || []
    )
  }, [learnersData])

  // State for MultipleSelector
  const [selectedLearners, setSelectedLearners] = React.useState<Option[]>([])

  // Initialize form with session data when editing
  useEffect(() => {
    if (session && open) {
      const startDate = session.startDate
        ? new Date(session.startDate)
        : undefined

      form.reset({
        trainer_id: session.trainer_id?.user_id?.toString() || '',
        learners: session.learners?.map((l) => l.learner_id.toString()) || [],
        title: session.title || '',
        description: session.description || '',
        location: session.location || '',
        startDate: startDate ? format(startDate, "yyyy-MM-dd'T'HH:mm") : '',
        Duration: session.Duration || '0:0',
        type: session.type || '',
      })

      // Match session learners with learnerOptions to get full names
      const selectedLearnersOptions: Option[] =
        session.learners
          ?.map((l) => {
            const learnerOption = learnerOptions.find(
              (opt) => opt.value === l.learner_id.toString()
            )
            return (
              learnerOption || {
                value: l.learner_id.toString(),
                label: l.user_name, // Fallback to user_name if not in options yet
              }
            )
          })
          .filter((opt): opt is Option => opt !== undefined) || []

      setSelectedLearners(selectedLearnersOptions)
    } else if (!session && open) {
      form.reset({
        trainer_id: '',
        learners: [],
        title: '',
        description: '',
        location: '',
        startDate: '',
        Duration: '0:0',
        type: '',
      })
      setSelectedLearners([])
    }
  }, [session, open, form, learnerOptions])

  const durationParts = form.watch('Duration').split(':')
  const hours = durationParts[0] || '0'
  const minutes = durationParts[1] || '0'

  const handleDurationChange = (type: 'hours' | 'minutes', value: number) => {
    const currentDuration = form.getValues('Duration')
    const parts = currentDuration.split(':')
    const currentHours = parseInt(parts[0] || '0', 10)
    const currentMinutes = parseInt(parts[1] || '0', 10)

    if (type === 'hours') {
      if (value < 0 || value > 23) return
      form.setValue('Duration', `${value}:${currentMinutes}`, {
        shouldValidate: true,
      })
    } else {
      if (value < 0 || value > 59) return
      form.setValue('Duration', `${currentHours}:${value}`, {
        shouldValidate: true,
      })
    }
  }

  const onSubmit = async (values: SessionFormValues) => {
    try {
      const payload = {
        trainer_id: parseInt(values.trainer_id, 10),
        learners: values.learners.map((id) => parseInt(id, 10)),
        title: values.title,
        description: values.description || '',
        location: values.location,
        startDate: values.startDate,
        Duration: values.Duration,
        type: values.type,
      }

      if (isEdit && session) {
        await updateSession({
          id: session.session_id,
          data: payload,
        }).unwrap()
        toast.success('Session updated successfully')
      } else {
        await createSession(payload).unwrap()
        toast.success('Session created successfully')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string } })?.data?.error ||
        'Failed to save session'
      toast.error(errorMessage)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Session' : 'Book a New Session'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the session details below.'
              : 'Fill in the details to create a new session.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          {/* Trainer Selection */}
          <div className='space-y-2'>
            <Label htmlFor='trainer_id'>
              Select Trainer <span className='text-destructive'>*</span>
            </Label>
            <Controller
              name='trainer_id'
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select trainer' />
                  </SelectTrigger>
                  <SelectContent>
                    {isTrainersLoading ? (
                      <SelectItem value='loading' disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      trainersData?.data?.map((trainer) => (
                        <SelectItem
                          key={trainer.user_id}
                          value={trainer.user_id.toString()}
                        >
                          {trainer.first_name} {trainer.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.trainer_id && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.trainer_id.message}
              </p>
            )}
          </div>

          {/* Learners Selection */}
          <div className='space-y-2'>
            <Label>
              Select Learner(s) <span className='text-destructive'>*</span>
            </Label>
            <Controller
              name='learners'
              control={form.control}
              render={({ field }) => (
                <MultipleSelector
                  value={selectedLearners}
                  onChange={(options) => {
                    setSelectedLearners(options)
                    field.onChange(options.map((opt) => opt.value))
                  }}
                  options={learnerOptions}
                  placeholder='Select learners...'
                  emptyIndicator={
                    <p className='text-center text-sm text-muted-foreground'>
                      No learners found
                    </p>
                  }
                  disabled={isLoading || isLearnersLoading}
                  hidePlaceholderWhenSelected
                  className='w-full'
                />
              )}
            />
            {form.formState.errors.learners && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.learners.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div className='space-y-2'>
            <Label htmlFor='title'>
              Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='title'
              {...form.register('title')}
              disabled={isLoading}
              placeholder='Enter session title'
            />
            {form.formState.errors.title && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              {...form.register('description')}
              disabled={isLoading}
              placeholder='Enter session description'
              rows={4}
            />
          </div>

          {/* Location */}
          <div className='space-y-2'>
            <Label htmlFor='location'>
              Enter Session Location <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='location'
              {...form.register('location')}
              disabled={isLoading}
              placeholder='Enter location'
            />
            {form.formState.errors.location && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.location.message}
              </p>
            )}
          </div>

          {/* Start Date and Time */}
          <div className='space-y-2'>
            <Label>
              Select Session Date and Time{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <Controller
              name='startDate'
              control={form.control}
              render={({ field }) => (
                <Input
                  type='datetime-local'
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            {form.formState.errors.startDate && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div className='space-y-2'>
            <Label>
              Select Session Duration{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='hours'>Hours</Label>
                <Input
                  id='hours'
                  type='number'
                  min='0'
                  max='23'
                  value={hours}
                  onChange={(e) =>
                    handleDurationChange(
                      'hours',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  disabled={isLoading}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='minutes'>Minutes</Label>
                <Input
                  id='minutes'
                  type='number'
                  min='0'
                  max='59'
                  value={minutes}
                  onChange={(e) =>
                    handleDurationChange(
                      'minutes',
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Session Type */}
          <div className='space-y-2'>
            <Label htmlFor='type'>
              Select Session Type <span className='text-destructive'>*</span>
            </Label>
            <Controller
              name='type'
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select Session Type' />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.type && (
              <p className='text-sm text-destructive'>
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
