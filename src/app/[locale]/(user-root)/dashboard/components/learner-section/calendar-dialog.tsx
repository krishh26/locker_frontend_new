"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Calendar } from "@/app/[locale]/(learner-root)/demo-calendar/components/calendar"
import { CalendarEvent } from "@/app/[locale]/(learner-root)/demo-calendar/types"
interface CalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalendarDialog({ open, onOpenChange }: CalendarDialogProps) {
  // TODO: Fetch actual events from API
  const events: CalendarEvent[] = []
  const eventDates: Array<{ date: Date; count: number }> = []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar</DialogTitle>
          <DialogDescription>
            View and manage your scheduled events and appointments
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Calendar events={events} eventDates={eventDates} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

