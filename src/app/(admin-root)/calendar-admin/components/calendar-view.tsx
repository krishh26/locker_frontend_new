"use client";

import { CalendarMonthView } from "./calendar-month-view";
import { CalendarListView } from "./calendar-list-view";
import type { Session, SessionMetaData } from "@/store/api/session/types";

interface CalendarViewProps {
  viewMode: "calendar" | "list";
  sessions: Session[];
  isLoading?: boolean;
  metaData?: SessionMetaData;
  onPageChange: (page: number) => void;
}

export function CalendarView({
  viewMode,
  sessions,
  isLoading,
  metaData,
  onPageChange,
}: CalendarViewProps) {
  return (
    <div>
      {viewMode === "calendar" ? (
        <CalendarMonthView sessions={sessions} isLoading={isLoading} />
      ) : (
        <CalendarListView
          sessions={sessions}
          isLoading={isLoading}
          metaData={metaData}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

