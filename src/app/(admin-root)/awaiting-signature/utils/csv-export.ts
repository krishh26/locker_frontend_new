import type { AwaitingSignatureEntry } from "@/store/api/awaiting-signature/types";

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
 * Convert awaiting signature data to CSV format
 */
export function exportAwaitingSignatureToCSV(data: AwaitingSignatureEntry[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  // Define CSV headers
  const headers = [
    "Learner Name",
    "Course Name",
    "Course Code",
    "Employer Name",
    "Trainer Name",
    "File Type",
    "File Name",
    "File Description",
    "Upload Date",
    "Trainer Received",
    "Trainer Signed",
    "Learner Received",
    "Learner Signed",
    "Employer Received",
    "Employer Signed",
    "IQA Received",
    "IQA Signed",
  ];

  // Convert data to CSV rows
  const rows = data.map((row) => [
    escapeCSVField(row.learner?.name),
    escapeCSVField(row.course?.name),
    escapeCSVField(row.course?.code),
    escapeCSVField(row.signatures?.Employer?.name),
    escapeCSVField(row.signatures?.Trainer?.name),
    escapeCSVField(row.file_type),
    escapeCSVField(row.file_name),
    escapeCSVField(row.file_description),
    formatDate(row.uploaded_at),
    formatDate(row.signatures?.Trainer?.requestedAt),
    formatDate(row.signatures?.Trainer?.signedAt),
    formatDate(row.signatures?.Learner?.requestedAt),
    formatDate(row.signatures?.Learner?.signedAt),
    formatDate(row.signatures?.Employer?.requestedAt),
    formatDate(row.signatures?.Employer?.signedAt),
    formatDate(row.signatures?.IQA?.requestedAt),
    formatDate(row.signatures?.IQA?.signedAt),
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
export function generateAwaitingSignatureFilename(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  return `awaiting_signature_${timestamp}.csv`;
}

