import { type Session } from "@/store/api/session/types";
import { convertDurationToMinutes } from "./session-transform";

/**
 * Format date for Excel CSV export
 */
function formatDateForExcel(date: string): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert sessions array to CSV format
 * Creates separate rows for each learner in a session
 */
export function exportSessionsToCSV(sessions: Session[]): string {
  const headers = [
    "Session ID",
    "Trainer Name",
    "Start Time",
    "Session Type",
    "Duration Minutes",
    "Session Location",
    "Formative Notes",
    "Learner First Name",
    "Session Attendance",
  ];

  const csvRows: string[] = [];

  sessions.forEach((session) => {
    const sessionId = session.session_id.toString();
    const trainerName = session.trainer_id?.user_name || "";
    const startTime = formatDateForExcel(session.startDate);
    const sessionType = session.type || "";
    const durationMinutes = convertDurationToMinutes(session.Duration).toString();
    const location = session.location || "";
    const description = session.description || "";
    const attendance = session.Attended || "";

    // If no learners, create one row with empty learner info
    if (!session.learners || session.learners.length === 0) {
      csvRows.push(
        [
          sessionId,
          escapeCSVField(trainerName),
          escapeCSVField(startTime),
          escapeCSVField(sessionType),
          durationMinutes,
          escapeCSVField(location),
          escapeCSVField(description),
          '""',
          escapeCSVField(attendance),
        ].join(",")
      );
    } else {
      // Create a separate row for each learner
      session.learners.forEach((learner) => {
        csvRows.push(
          [
            sessionId,
            escapeCSVField(trainerName),
            escapeCSVField(startTime),
            escapeCSVField(sessionType),
            durationMinutes,
            escapeCSVField(location),
            escapeCSVField(description),
            escapeCSVField(learner.user_name || ""),
            escapeCSVField(attendance),
          ].join(",")
        );
      });
    }
  });

  // Create CSV content
  const csvContent = [headers.join(","), ...csvRows].join("\n");

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}_${timestamp}.csv`;
}

