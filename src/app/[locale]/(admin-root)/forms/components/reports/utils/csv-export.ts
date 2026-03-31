/**
 * Escape CSV field value.
 * - Wraps in quotes if it contains comma/newline/quote and doubles internal quotes
 */
export function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return "";
  const stringField = String(field);
  if (
    stringField.includes(",") ||
    stringField.includes("\n") ||
    stringField.includes('"')
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

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

export function generateFormsReportFilename(formName?: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const safeName = (formName || "form").replace(/[^\w\-]+/g, "-").replace(/-+/g, "-");
  return `forms-report-${safeName}-${timestamp}.csv`;
}

