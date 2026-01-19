import type { TimeLogExportData } from "@/store/api/time-log/types";

/**
 * Formats date for Excel CSV export
 */
function formatDateForExcel(dateString: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Escape CSV field value
 */
function escapeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return "";
  }
  
  const stringField = String(field);
  
  // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringField.includes(",") || stringField.includes("\n") || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

/**
 * Convert timelog data to CSV format
 */
export function exportTimelogToCSV(data: TimeLogExportData[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  // Define CSV headers
  const headers = [
    "ID",
    "Activity Date",
    "Activity Type",
    "Unit",
    "Type",
    "Spend Time",
    "Start Time",
    "End Time",
    "Impact on Learner",
    "Evidence Link",
    "Verified",
    "Trainer Name",
    "Trainer Email",
    "Course Name",
    "Course Code",
    "Created At",
    "Updated At",
  ];

  // Convert data to CSV rows
  const rows = data.map((item) => [
    item.id.toString(),
    formatDateForExcel(item.activity_date),
    escapeCSVField(item.activity_type),
    escapeCSVField(item.unit),
    escapeCSVField(item.type),
    escapeCSVField(item.spend_time),
    escapeCSVField(item.start_time),
    escapeCSVField(item.end_time),
    escapeCSVField(item.impact_on_learner),
    escapeCSVField(item.evidence_link),
    item.verified ? "Yes" : "No",
    escapeCSVField(item.trainer_id?.user_name || ""),
    escapeCSVField(item.trainer_id?.email || ""),
    escapeCSVField(item.course_id?.course_name || ""),
    escapeCSVField(item.course_id?.course_code || ""),
    formatDateForExcel(item.created_at),
    formatDateForExcel(item.updated_at),
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

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
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateTimelogFilename(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `timelog-export-${timestamp}.csv`;
}

