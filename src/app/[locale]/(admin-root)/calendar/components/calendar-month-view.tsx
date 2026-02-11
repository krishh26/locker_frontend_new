"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Session } from "@/store/api/session/types";
import { transformSessionsToCalendarEvents } from "../utils/session-transform";
import { CalendarStatusLegend } from "./calendar-status-legend";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarEvent } from "@/app/[locale]/(learner-root)/demo-calendar/types";

interface CalendarMonthViewProps {
  sessions: Session[];
  isLoading?: boolean;
}

export function CalendarMonthView({ sessions, isLoading }: CalendarMonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Transform sessions to calendar events
  const calendarEvents: CalendarEvent[] = transformSessionsToCalendarEvents(sessions);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Extend to show full weeks (including previous/next month days)
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, date));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CalendarStatusLegend />
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Status Legend */}
      <CalendarStatusLegend />

      <Card className="p-6 bg-linear-to-br from-sky-50/40 to-indigo-50/40 dark:from-sky-950/20 dark:to-indigo-950/15 border-sky-200/40 dark:border-sky-800/20">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col flex-wrap gap-4 pb-4 border-b border-sky-200/40 dark:border-sky-800/20 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold ml-4">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 bg-background mt-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b bg-linear-to-r from-indigo-50/50 to-sky-50/50 dark:from-indigo-950/30 dark:to-sky-950/20 rounded-t-lg">
              {weekDays.map(day => (
                <div key={day} className="p-4 text-center font-semibold text-sm text-indigo-700 dark:text-indigo-300 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 flex-1">
              {calendarDays.map(day => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer transition-all duration-200",
                      isCurrentMonth
                        ? "bg-background/80 hover:bg-linear-to-br hover:from-primary/5 hover:to-primary/10"
                        : "bg-muted/20 text-muted-foreground",
                      isSelected && "ring-2 ring-primary ring-inset bg-primary/5",
                      isDayToday && "bg-linear-to-br from-amber-50/70 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-medium",
                        isDayToday && "bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs"
                      )}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-xs p-1 rounded-sm text-white cursor-pointer truncate",
                            event.color
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Handle event click to show session details
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

