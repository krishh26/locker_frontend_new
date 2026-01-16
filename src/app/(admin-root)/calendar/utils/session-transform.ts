import { CalendarEvent } from "@/app/(learner-root)/demo-calendar/types";
import { type Session } from "@/store/api/session/types";

/**
 * Parse duration string ("0:30" or "1:30") to hours and minutes
 */
export function parseDuration(duration?: string): { hours: number; minutes: number } {
  if (!duration) return { hours: 0, minutes: 0 };
  
  const parts = duration.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  
  return { hours, minutes };
}

/**
 * Convert duration string to total minutes
 */
export function convertDurationToMinutes(duration?: string): number {
  const { hours, minutes } = parseDuration(duration);
  return hours * 60 + minutes;
}

/**
 * Get event color based on attendance status
 */
export function getEventColorByStatus(status?: string): string {
  switch (status) {
    case "Attended":
      return "bg-blue-500";
    case "Cancelled":
    case "Cancelled by Assessor":
    case "Cancelled by Learner":
    case "Cancelled by Employer":
      return "bg-red-500";
    case "Learner Late":
    case "Assessor Late":
      return "bg-orange-500";
    case "Learner not Attended":
      return "bg-gray-500";
    default:
      return "bg-slate-400";
  }
}

/**
 * Transform session data to calendar event format
 */
export function transformSessionsToCalendarEvents(
  sessions: Session[]
): CalendarEvent[] {
  return sessions
    .map((session) => {
      const startDate = new Date(session.startDate);

      if (isNaN(startDate.getTime())) {
        return null;
      }

      // Calculate end date based on duration
      const { hours, minutes } = parseDuration(session.Duration);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + hours);
      endDate.setMinutes(startDate.getMinutes() + minutes);

      // Get color based on status
      const color = getEventColorByStatus(session.Attended);

      // Format duration for display
      const durationDisplay = session.Duration || "0:0";

      // Get attendees (learners)
      const attendees = session.learners?.map((learner) => learner.user_name) || [];

      return {
        id: session.session_id,
        title: session.title || "Untitled Session",
        date: startDate,
        time: startDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        duration: durationDisplay,
        type: "meeting" as CalendarEvent["type"],
        attendees,
        location: session.location || "",
        color,
        description: session.description,
      } as CalendarEvent;
    })
    .filter((event): event is CalendarEvent => event !== null);
}

/**
 * Format date for display
 */
export function formatSessionDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

