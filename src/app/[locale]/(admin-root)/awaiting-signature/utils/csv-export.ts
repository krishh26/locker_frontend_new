import type { AwaitingSignatureEntry } from "@/store/api/awaiting-signature/types";
import { formatCsvDateTime } from "@/utils/csv-export-helpers";

type TranslateFn = (key: string) => string;

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | undefined): string {
  if (!value) return "-";
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert awaiting signature data to CSV format (client-safe).
 */
export function exportAwaitingSignatureToCSV(
  data: AwaitingSignatureEntry[],
  tHeaders: TranslateFn,
): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = [
    tHeaders("learnerName"),
    tHeaders("courseName"),
    tHeaders("courseCode"),
    tHeaders("employerName"),
    tHeaders("trainerName"),
    tHeaders("fileType"),
    tHeaders("fileName"),
    tHeaders("fileDescription"),
    tHeaders("uploadDate"),
    tHeaders("trainerReceived"),
    tHeaders("trainerSigned"),
    tHeaders("learnerReceived"),
    tHeaders("learnerSigned"),
    tHeaders("employerReceived"),
    tHeaders("employerSigned"),
    tHeaders("iqaReceived"),
    tHeaders("iqaSigned"),
  ];

  const rows = data.map((row) => [
    escapeCSVField(row.learner?.name),
    escapeCSVField(row.course?.name),
    escapeCSVField(row.course?.code),
    escapeCSVField(row.signatures?.Employer?.name),
    escapeCSVField(row.signatures?.Trainer?.name),
    escapeCSVField(row.file_type),
    escapeCSVField(row.file_name),
    escapeCSVField(row.file_description),
    formatCsvDateTime(row.uploaded_at),
    formatCsvDateTime(row.signatures?.Trainer?.requestedAt),
    formatCsvDateTime(row.signatures?.Trainer?.signedAt),
    formatCsvDateTime(row.signatures?.Learner?.requestedAt),
    formatCsvDateTime(row.signatures?.Learner?.signedAt),
    formatCsvDateTime(row.signatures?.Employer?.requestedAt),
    formatCsvDateTime(row.signatures?.Employer?.signedAt),
    formatCsvDateTime(row.signatures?.IQA?.requestedAt),
    formatCsvDateTime(row.signatures?.IQA?.signedAt),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Download CSV file in the browser.
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
 * Generate filename with timestamp (client-safe).
 */
export function generateAwaitingSignatureFilename(prefix: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `${prefix}_${timestamp}.csv`;
}
