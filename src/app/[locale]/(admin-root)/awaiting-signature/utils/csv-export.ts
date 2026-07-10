import type { AwaitingSignatureEntry } from "@/store/api/awaiting-signature/types";
import { formatCsvDateTime } from "@/utils/csv-export-helpers";
import { getTranslations } from "next-intl/server";

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
export async function exportAwaitingSignatureToCSV(data: AwaitingSignatureEntry[]): Promise<string> {
  if (!data || data.length === 0) {
    return "";
  }

  const t = await getTranslations("awaitingSignature.csv.headers");

  // Define CSV headers
  const headers = [
    t("learnerName"),
    t("courseName"),
    t("courseCode"),
    t("employerName"),
    t("trainerName"),
    t("fileType"),
    t("fileName"),
    t("fileDescription"),
    t("uploadDate"),
    t("trainerReceived"),
    t("trainerSigned"),
    t("learnerReceived"),
    t("learnerSigned"),
    t("employerReceived"),
    t("employerSigned"),
    t("iqaReceived"),
    t("iqaSigned"),
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
export async function generateAwaitingSignatureFilename(): Promise<string> {
  const t = await getTranslations("awaitingSignature.csv");
  const timestamp = new Date().toISOString().split("T")[0];
  const prefix = t("filenamePrefix");
  return `${prefix}_${timestamp}.csv`;
}

