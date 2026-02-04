import jsPDF from "jspdf"
import { applyPlugin } from "jspdf-autotable"

applyPlugin(jsPDF)

export interface ExportTableToPdfOptions {
  title: string
  headers: string[]
  rows: string[][]
  filename?: string
}

export interface InvoiceLineRow {
  periodLabel: string
  dueDate: string
  amount: number
  discountPercent: number | null
  taxPercent: number | null
  rowTotal: number
}

export interface ExportInvoiceToPdfOptions {
  organisationName: string
  planName: string
  invoiceDate: string
  invoiceNumber?: string
  currency: string
  lineItems: InvoiceLineRow[]
  subtotal: number
  totalDiscount: number
  totalTax: number
  total: number
  notes?: string
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

/**
 * Generate and download an invoice PDF (single invoice with line items and totals).
 */
export function exportInvoiceToPdf(options: ExportInvoiceToPdfOptions): void {
  const {
    organisationName,
    planName,
    invoiceDate,
    invoiceNumber,
    currency,
    lineItems,
    subtotal,
    totalDiscount,
    totalTax,
    total,
    notes,
    filename,
  } = options

  const doc = new jsPDF()
  const dateDisplay = invoiceDate.includes("T")
    ? new Date(invoiceDate).toLocaleDateString()
    : invoiceDate
  const defaultFilename = `Invoice_${organisationName.replace(/\s+/g, "-")}_${invoiceDate.split("T")[0]}.pdf`
  const finalFilename = filename ?? defaultFilename

  doc.setFontSize(18)
  doc.text("Invoice", 14, 20)
  doc.setFontSize(10)
  doc.text(`Organisation: ${organisationName}`, 14, 28)
  doc.text(`Plan: ${planName}`, 14, 34)
  doc.text(`Date: ${dateDisplay}`, 14, 40)
  if (invoiceNumber) {
    doc.text(`Invoice #: ${invoiceNumber}`, 14, 46)
  }
  const startY = invoiceNumber ? 52 : 46

  const headers = ["Period", "Due date", "Amount", "Disc. %", "Tax %", "Total"]
  const rows = lineItems.map((item) => [
    item.periodLabel,
    item.dueDate.includes("T") ? item.dueDate.split("T")[0] : item.dueDate,
    `${currency} ${item.amount.toFixed(2)}`,
    item.discountPercent != null ? `${item.discountPercent}%` : "—",
    item.taxPercent != null ? `${item.taxPercent}%` : "—",
    `${currency} ${item.rowTotal.toFixed(2)}`,
  ])

  ;(doc as jsPDF & { autoTable: (opts: unknown) => void; lastAutoTable: { finalY: number } }).autoTable({
    startY,
    head: [headers],
    body: rows,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 85, 105] },
  })

  const docWithAutoTable = doc as jsPDF & { lastAutoTable: { finalY: number } }
  let y = docWithAutoTable.lastAutoTable.finalY + 10

  doc.setFontSize(10)
  doc.text(`Subtotal: ${currency} ${subtotal.toFixed(2)}`, 14, y)
  y += 6
  doc.text(`Discount: -${currency} ${totalDiscount.toFixed(2)}`, 14, y)
  y += 6
  doc.text(`Tax: +${currency} ${totalTax.toFixed(2)}`, 14, y)
  y += 6
  doc.setFont("helvetica", "bold")
  doc.text(`Total: ${currency} ${total.toFixed(2)}`, 14, y)
  doc.setFont("helvetica", "normal")
  y += 10

  if (notes && notes.trim()) {
    doc.setFontSize(9)
    doc.text(`Notes: ${notes.trim()}`, 14, y)
  }

  doc.save(finalFilename)
}
