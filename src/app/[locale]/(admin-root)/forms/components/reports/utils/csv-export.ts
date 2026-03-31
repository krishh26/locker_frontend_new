export function downloadBlob(blob: Blob, filename: string): void {
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
  return `forms-report-${safeName}-${timestamp}.xlsx`;
}

