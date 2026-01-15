import type { GatewayData } from "../components/gateway-report-data-table";

/**
 * Formats date for Excel CSV export
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | undefined): string {
  if (!value) return "-";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert gateway report data to CSV format
 */
export function exportGatewayReportToCSV(data: GatewayData[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  // Define CSV headers
  const headers = [
    "Learner First Name",
    "Learner Last Name",
    "Learner ULN",
    "Course Name",
    "Trainer Name",
    "Session Book Date",
    "Gateway Progress %",
  ];

  // Convert data to CSV rows
  const rows = data.map((row) => [
    escapeCSVField(row.learner_first_name),
    escapeCSVField(row.learner_last_name),
    escapeCSVField(row.learner_uln),
    escapeCSVField(row.course_name), // Already wrapped in quotes if needed
    escapeCSVField(row.trainer_name),
    formatDate(row.session_book_date),
    row.gateway_progress.toString(),
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

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
export function generateGatewayReportFilename(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `gateway-report-${timestamp}.csv`;
}

