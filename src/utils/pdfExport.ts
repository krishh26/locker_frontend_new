import type { jsPDF as JsPDFCtor } from "jspdf"

let pdfDepsPromise:
  | Promise<{
      // Use the browser-friendly UMD build to avoid node-only deps like fflate/node.cjs
      jsPDF: typeof JsPDFCtor
      applyPlugin: typeof import("jspdf-autotable")["applyPlugin"]
    }>
  | null = null

async function getPdfDeps() {
  if (!pdfDepsPromise) {
    pdfDepsPromise = Promise.all([
      // Explicitly import the browser UMD bundle so Next.js doesn't pull in the Node build
      import("jspdf/dist/jspdf.umd.min.js"),
      import("jspdf-autotable"),
    ]).then(([jspdfMod, autotableMod]) => {
      return {
        jsPDF: jspdfMod.jsPDF,
        applyPlugin: autotableMod.applyPlugin,
      }
    })
  }
  return pdfDepsPromise
}

export interface ExportTableToPdfOptions {
  title: string
  headers: string[]
  rows: string[][]
  filename?: string
}

export type GapAnalysisPdfGap = "complete" | "partial" | "none"

export interface GapAnalysisPdfRow {
  subTitle: string
  learnerMap: string
  trainerMap: string
  gap: GapAnalysisPdfGap
  comment?: string
}

export interface GapAnalysisPdfUnitSection {
  unitTitle: string
  rows: GapAnalysisPdfRow[]
}

export interface ExportGapAnalysisToPdfOptions {
  title: string
  courseName?: string
  headers: string[]
  unitSections: GapAnalysisPdfUnitSection[]
  isStandardCourse: boolean
  filename?: string
}

function getGapPdfColor(gap: GapAnalysisPdfGap): [number, number, number] {
  switch (gap) {
    case "complete":
      return [28, 171, 176]
    case "partial":
      return [0, 129, 204]
    default:
      return [239, 68, 68]
  }
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
export async function exportTableToPdf(options: ExportTableToPdfOptions): Promise<void> {
  if (typeof window === "undefined") return

  const { title, headers, rows, filename } = options

  if (!rows || rows.length === 0) {
    return
  }

  const { jsPDF, applyPlugin } = await getPdfDeps()
  applyPlugin(jsPDF)

  const doc = new jsPDF()
  const dateStr = new Date().toLocaleDateString()
  const defaultFilename = `${title.replace(/\s+/g, "-")}_${new Date().toISOString().split("T")[0]}.pdf`
  const finalFilename = filename ?? defaultFilename

  doc.setFontSize(18)
  doc.text(title, 14, 20)
  doc.setFontSize(10)
  doc.text(`Generated on: ${dateStr}`, 14, 28)

  ;(
    doc as InstanceType<typeof JsPDFCtor> & {
      autoTable: (opts: unknown) => void
      lastAutoTable: { finalY: number }
    }
  ).autoTable({
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
 * Export gap analysis with unit headers, sub-unit rows, and colored gap boxes (no gap text).
 */
export async function exportGapAnalysisToPdf(
  options: ExportGapAnalysisToPdfOptions,
): Promise<void> {
  if (typeof window === "undefined") return

  const { title, courseName, headers, unitSections, isStandardCourse, filename } =
    options

  const hasRows = unitSections.some((section) => section.rows.length > 0)
  if (!unitSections.length) {
    return
  }
  if (isStandardCourse && !hasRows) {
    return
  }

  const { jsPDF, applyPlugin } = await getPdfDeps()
  applyPlugin(jsPDF)

  const doc = new jsPDF()
  const dateStr = new Date().toLocaleDateString()
  const defaultFilename = `${title.replace(/\s+/g, "-")}_${new Date().toISOString().split("T")[0]}.pdf`
  const finalFilename = filename ?? defaultFilename
  const gapColumnIndex = isStandardCourse ? 4 : 3

  type PdfRowMeta = { gap?: GapAnalysisPdfGap; isUnitHeader?: boolean }
  const body: unknown[][] = []
  const rowMetas: PdfRowMeta[] = []

  for (const section of unitSections) {
    if (!isStandardCourse && section.unitTitle) {
      body.push([
        {
          content: section.unitTitle,
          colSpan: headers.length,
          styles: {
            fillColor: [241, 245, 249],
            textColor: [15, 23, 42],
            fontStyle: "bold",
            fontSize: 10,
          },
        },
      ])
      rowMetas.push({ isUnitHeader: true })
    }

    for (const row of section.rows) {
      body.push(
        isStandardCourse
          ? [
              row.subTitle,
              row.comment ?? "",
              row.learnerMap,
              row.trainerMap,
              "",
            ]
          : [
              row.subTitle,
              row.learnerMap,
              row.trainerMap,
              "",
              row.comment ?? "",
            ],
      )
      rowMetas.push({ gap: row.gap })
    }
  }

  doc.setFontSize(18)
  doc.text(title, 14, 20)
  doc.setFontSize(10)
  let metaY = 28
  if (courseName) {
    doc.text(`Course: ${courseName}`, 14, metaY)
    metaY += 6
  }
  doc.text(`Generated on: ${dateStr}`, 14, metaY)

  ;(
    doc as InstanceType<typeof JsPDFCtor> & {
      autoTable: (opts: unknown) => void
    }
  ).autoTable({
    startY: metaY + 6,
    head: [headers],
    body,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, valign: "middle" },
    headStyles: { fillColor: [71, 85, 105] },
    columnStyles: {
      [gapColumnIndex]: { cellWidth: 24, halign: "center" },
      ...(isStandardCourse ? { 0: { cellWidth: 58 } } : { 0: { cellWidth: 72 } }),
    },
    didDrawCell: (data: {
      section: string
      row: { index: number }
      column: { index: number }
      cell: { x: number; y: number; width: number; height: number }
    }) => {
      if (data.section !== "body") return

      const meta = rowMetas[data.row.index]
      if (meta?.isUnitHeader || data.column.index !== gapColumnIndex || !meta?.gap) {
        return
      }

      const boxWidth = Math.min(22, data.cell.width - 6)
      const boxHeight = 5
      const boxX = data.cell.x + (data.cell.width - boxWidth) / 2
      const boxY = data.cell.y + (data.cell.height - boxHeight) / 2
      const [r, g, b] = getGapPdfColor(meta.gap)

      doc.setFillColor(r, g, b)
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1, 1, "F")
    },
  })

  doc.save(finalFilename)
}

/**
 * Generate and download an invoice PDF (single invoice with line items and totals).
 */
export async function exportInvoiceToPdf(options: ExportInvoiceToPdfOptions): Promise<void> {
  if (typeof window === "undefined") return

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

  const { jsPDF, applyPlugin } = await getPdfDeps()
  applyPlugin(jsPDF)

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

  ;(
    doc as InstanceType<typeof JsPDFCtor> & {
      autoTable: (opts: unknown) => void
      lastAutoTable: { finalY: number }
    }
  ).autoTable({
    startY,
    head: [headers],
    body: rows,
    theme: "grid",
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [71, 85, 105] },
  })

  const docWithAutoTable = doc as InstanceType<typeof JsPDFCtor> & {
    lastAutoTable: { finalY: number }
  }
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
