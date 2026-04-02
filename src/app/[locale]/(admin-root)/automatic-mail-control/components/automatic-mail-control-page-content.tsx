'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

import {
  useListSessionReminderSettingsQuery,
  useCreateSessionReminderSettingMutation,
  useUpdateSessionReminderSettingMutation,
  useDeleteSessionReminderSettingMutation,
  type SessionReminderRecipient,
} from '@/store/api/session-settings/sessionReminderSettingsApi'
import { PageHeader } from '@/components/dashboard/page-header'

const DAYS = [1, 5, 7]

export default function SessionReminderSettings() {
  const { data, isLoading } = useListSessionReminderSettingsQuery()

  const [createReminder] = useCreateSessionReminderSettingMutation()
  const [updateReminder] = useUpdateSessionReminderSettingMutation()
  const [deleteReminder] = useDeleteSessionReminderSettingMutation()

  const reminders = data?.data ?? []

  const getReminder = (recipient: SessionReminderRecipient, day: number) => {
    return reminders.find(
      (r) => r.recipient === recipient && r.days_before === day,
    )
  }

  const getDayLabel = (day: number) => {
    return day === 1 ? '1 day before' : `${day} days before`
  }

  // 🔹 Handle checkbox toggle
  const handleChange = async (
    checked: boolean,
    day: number,
    recipient: SessionReminderRecipient,
  ) => {
    const existing = getReminder(recipient, day)

    try {
      if (checked) {
        if (existing) {
          // ✅ Already exists → just activate
          await updateReminder({
            id: existing.id,
            is_active: true,
          }).unwrap()

          toast.success('Updated')
        } else {
          // ✅ Create new
          await createReminder({
            days_before: day,
            label: getDayLabel(day),
            is_active: true,
            recipient,
          }).unwrap()

          toast.success('Created')
        }
      } else {
        if (existing) {
          // ❌ Remove
          await deleteReminder({ id: existing.id }).unwrap()

          toast.success('Removed')
        }
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { data?: { message?: string } })?.data?.message

      toast.error(message || 'Something went wrong')
    }
  }


  return (
    <div className='space-y-6 px-4 lg:px-6 pb-8'>
      <PageHeader
        title='Mail Settings'
        subtitle='Control the automatic mail sending for the platform'
      />
      <div className='mt-6'>
        {/* Loading state */}
        {isLoading && (
          <div className='space-y-6 px-4 lg:px-6 pb-8'>
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-12 w-full rounded-lg' />
              ))}
            </div>
          </div>
        )}
        {/* Automatic Mail Control */}
        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Session Reminder</CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='grid gap-4 lg:grid-cols-2'>
                {/* Learner */}
                <div className='border rounded-xl overflow-hidden'>
                  <div className='grid grid-cols-2 bg-muted p-3 font-medium text-sm'>
                    <div>Learner - Days Before</div>
                    <div className='text-center'>Active</div>
                  </div>

                  {DAYS.map((day) => {
                    const existing = getReminder('Learner', day)

                    return (
                      <div
                        key={day}
                        className='grid grid-cols-2 items-center p-3 border-t'
                      >
                        <div className='font-medium'>{day} Day</div>

                        <div className='flex justify-center'>
                          <Checkbox
                            checked={!!existing && existing.is_active}
                            onCheckedChange={(checked) =>
                              handleChange(checked === true, day, 'Learner')
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Trainer */}
                <div className='border rounded-xl overflow-hidden'>
                  <div className='grid grid-cols-2 bg-muted p-3 font-medium text-sm'>
                    <div>Trainer - Days Before</div>
                    <div className='text-center'>Active</div>
                  </div>

                  {DAYS.map((day) => {
                    const existing = getReminder('Trainer', day)

                    return (
                      <div
                        key={day}
                        className='grid grid-cols-2 items-center p-3 border-t'
                      >
                        <div className='font-medium'>{day} Day</div>

                        <div className='flex justify-center'>
                          <Checkbox
                            checked={!!existing && existing.is_active}
                            onCheckedChange={(checked) =>
                              handleChange(checked === true, day, 'Trainer')
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
