import jsPDF from "jspdf"
import { applyPlugin } from "jspdf-autotable"

applyPlugin(jsPDF)

export interface ExportTableToPdfOptions {
  title: string
  headers: string[]
  rows: string[][]
  filename?: string
}

/**
 * Export a table (title + headers + rows) to PDF and trigger download.
 * If rows is empty, does nothing; caller should show "No data to export" toast.
 */
export function exportTableToPdf(options: ExportTableToPdfOptions): void {
  const { title, headers, rows, filename } = options

  if (!rows || rows.length === 0) {
    return
  }

  const doc = new jsPDF()
  const dateStr = new Date().toLocaleDateString()
  const defaultFilename = `${title.replace(/\s+/g, "-")}_${new Date().toISOString().split("T")[0]}.pdf`
  const finalFilename = filename ?? defaultFilename

  doc.setFontSize(18)
  doc.text(title, 14, 20)
  doc.setFontSize(10)
  doc.text(`Generated on: ${dateStr}`, 14, 28)

  ;(doc as jsPDF & { autoTable: (opts: unknown) => void; lastAutoTable: { finalY: number } }).autoTable({
    startY: 34,
    head: [headers],
    body: rows,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 85, 105] },
  })

  doc.save(finalFilename)
}
