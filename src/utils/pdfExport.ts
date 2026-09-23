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
  srNo: string
  subTitle: string
  learnerMap: string
  trainerMap: string
  gap: GapAnalysisPdfGap
  /** Evidence submission count shown as circles under the gap bar (UI parity). */
  evidenceCount?: number
  comment?: string
}

export interface GapAnalysisPdfUnitSection {
  unitTitle: string
  rows: GapAnalysisPdfRow[]
  subSections?: Array<{
    title: string
    rows: GapAnalysisPdfRow[]
  }>
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

/**
 * jsPDF's default Helvetica only supports WinAnsi.
 * Unsupported Unicode (smart quotes, soft hyphens, bullets, etc.) makes
 * glyph-width math fail → characters get stretched across the cell
 * (looks like letter-spacing) and some glyphs render as "/".
 */
function sanitizePdfText(value: unknown): string {
  let text = String(value ?? "")

  try {
    text = text.normalize("NFKC")
  } catch {
    // ignore environments without normalize
  }

  text = text
    // Soft hyphen / zero-width / BOM / bidi marks
    .replace(/[\u00AD\u200B-\u200F\u2028\u2029\uFEFF\u2060]/g, "")
    // Smart quotes → ASCII
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')
    // Dashes / minus variants
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    // Bullets / middots / diamonds often used in criteria text
    .replace(/[\u2022\u2023\u2043\u00B7\u2219\u25CF\u25E6\u25AA\u25AB]/g, "-")
    // Ellipsis
    .replace(/\u2026/g, "...")
    // Non-breaking / thin / narrow spaces → normal space
    .replace(/[\u00A0\u202F\u2000-\u200A]/g, " ")
    // Strip any remaining non-WinAnsi (keep latin-1 printable + tab/newline)
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
    // Collapse whitespace but keep single spaces
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

function setPdfCharSpaceZero(doc: InstanceType<typeof JsPDFCtor>) {
  if (typeof (doc as { setCharSpace?: (n: number) => void }).setCharSpace === "function") {
    ;(doc as { setCharSpace: (n: number) => void }).setCharSpace(0)
  }
}

/** Line height in document units (mm) for the current font size. */
function getPdfLineHeightMm(doc: InstanceType<typeof JsPDFCtor>): number {
  const fontSize = doc.getFontSize()
  const lineHeightFactor =
    typeof doc.getLineHeightFactor === "function" ? doc.getLineHeightFactor() : 1.15
  const scaleFactor = doc.internal.scaleFactor || 72 / 25.4
  return (fontSize * lineHeightFactor) / scaleFactor
}

/** Height needed to draw wrapped text with top/bottom padding. */
function getWrappedTextHeightMm(
  doc: InstanceType<typeof JsPDFCtor>,
  text: string,
  maxWidth: number,
  paddingY: number,
): { lines: string[]; height: number; lineHeight: number } {
  const lines = doc.splitTextToSize(text, Math.max(1, maxWidth)) as string[]
  const lineHeight = getPdfLineHeightMm(doc)
  const height = paddingY * 2 + Math.max(1, lines.length) * lineHeight
  return { lines, height, lineHeight }
}

/**
 * Only draw as many lines as fit inside the cell (padding included).
 * Prevents text from leaking past borders if height math is slightly off.
 */
function fitLinesToCellHeight(
  lines: string[],
  cellHeight: number,
  paddingY: number,
  lineHeight: number,
): string[] {
  const available = Math.max(lineHeight, cellHeight - paddingY * 2)
  const maxLines = Math.max(1, Math.floor(available / lineHeight + 1e-6))
  return lines.slice(0, maxLines)
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

  const hasRows = unitSections.some(
    (section) =>
      section.rows.length > 0 ||
      (section.subSections?.some((sub) => sub.rows.length > 0) ?? false),
  )
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
  const safeTitle = sanitizePdfText(title)
  const safeCourseName = courseName ? sanitizePdfText(courseName) : undefined
  const safeHeaders = headers.map(sanitizePdfText)
  const defaultFilename = `${safeTitle.replace(/\s+/g, "-")}_${new Date().toISOString().split("T")[0]}.pdf`
  const finalFilename = filename ?? defaultFilename
  const gapColumnIndex = 4
  const titleColumnIndex = 1

  type PdfRowMeta = {
    gap?: GapAnalysisPdfGap
    evidenceCount?: number
    isUnitHeader?: boolean
    headerTitle?: string
    headerFontSize?: number
    /** Assessment criteria / title drawn manually (avoids Helvetica stretch bugs). */
    cellTitle?: string
  }
  const body: unknown[][] = []
  const rowMetas: PdfRowMeta[] = []

  const pushHeaderRow = (
    content: string,
    styles: {
      fillColor: [number, number, number]
      textColor: [number, number, number]
      fontStyle: "bold"
      fontSize: number
    },
  ) => {
    const safe = sanitizePdfText(content)
    // Placeholder content — real title is drawn in didDrawCell
    body.push([
      {
        content: " ",
        colSpan: safeHeaders.length,
        styles: {
          ...styles,
          halign: "left",
          valign: "middle",
          overflow: "linebreak",
          minCellHeight: Math.max(12, styles.fontSize + 8),
          cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
        },
      },
    ])
    rowMetas.push({
      isUnitHeader: true,
      headerTitle: safe,
      headerFontSize: styles.fontSize,
    })
  }

  const pushDataRows = (rows: GapAnalysisPdfRow[]) => {
    for (const row of rows) {
      const cellTitle = sanitizePdfText(row.subTitle)
      const comment = sanitizePdfText(row.comment ?? "")
      const learnerMap = sanitizePdfText(row.learnerMap)
      const trainerMap = sanitizePdfText(row.trainerMap)
      const srNo = sanitizePdfText(row.srNo)

      // Leave title cell blank — drawn manually after sanitize
      body.push(
        isStandardCourse
          ? [srNo, " ", learnerMap, trainerMap, ""]
          : [srNo, " ", learnerMap, trainerMap, "", comment],
      )
      rowMetas.push({
        gap: row.gap,
        evidenceCount: row.evidenceCount ?? 0,
        cellTitle,
      })
    }
  }

  for (const section of unitSections) {
    if (section.unitTitle) {
      pushHeaderRow(section.unitTitle, {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
        fontSize: 10,
      })
    }

    if (section.subSections?.length) {
      for (const subSection of section.subSections) {
        if (subSection.title) {
          pushHeaderRow(subSection.title, {
            fillColor: [226, 232, 240],
            textColor: [15, 23, 42],
            fontStyle: "bold",
            fontSize: 9,
          })
        }
        pushDataRows(subSection.rows)
      }
    } else {
      pushDataRows(section.rows)
    }
  }

  setPdfCharSpaceZero(doc)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(18)
  doc.text(safeTitle, 14, 20)
  doc.setFontSize(10)
  let metaY = 28
  if (safeCourseName) {
    doc.text(`Course: ${safeCourseName}`, 14, metaY)
    metaY += 6
  }
  doc.text(`Generated on: ${dateStr}`, 14, metaY)

  // Usable page width ≈ 182mm (A4 210 − margins 14×2). Assign fixed widths so
  // title wrapping (and therefore row height) is predictable across pages.
  const titleColWidth = isStandardCourse ? 78 : 70
  const titlePadX = 2
  const titlePadY = 2.5
  const titleTextWidth = titleColWidth - titlePadX * 2
  const headerPadX = 4
  const headerPadY = 3
  const headerTextWidth = 182 - headerPadX * 2

  const gapContentMinHeight = (evidenceCount: number) => {
    const boxHeight = 4.5
    if (evidenceCount <= 0) return boxHeight + 5
    const circleBlock = 1.15 * 2 + (evidenceCount > 3 ? 3.2 : 0)
    return boxHeight + 1.4 + circleBlock + 5
  }

  ;(
    doc as InstanceType<typeof JsPDFCtor> & {
      autoTable: (opts: unknown) => void
    }
  ).autoTable({
    startY: metaY + 6,
    head: [safeHeaders],
    body,
    theme: "grid",
    // Keep each data row on a single page. Splitting rows + manual didDrawCell
    // text was the root cause of overflow at page boundaries and empty
    // "continuation" rows on the next page.
    rowPageBreak: "avoid",
    showHead: "everyPage",
    margin: { top: 14, right: 14, bottom: 16, left: 14 },
    styles: {
      font: "helvetica",
      fontSize: 9,
      valign: "middle",
      halign: "left",
      overflow: "linebreak",
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      minCellHeight: 12,
    },
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      halign: "left",
      valign: "middle",
      fontStyle: "bold",
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
    },
    columnStyles: isStandardCourse
      ? {
          0: { cellWidth: 18, halign: "left", valign: "middle" },
          [titleColumnIndex]: {
            cellWidth: titleColWidth,
            halign: "left",
            valign: "top",
            overflow: "linebreak",
          },
          2: { cellWidth: 29, halign: "left", valign: "middle" },
          3: { cellWidth: 29, halign: "left", valign: "middle" },
          [gapColumnIndex]: { cellWidth: 28, halign: "center", valign: "middle" },
        }
      : {
          0: { cellWidth: 18, halign: "left", valign: "middle" },
          [titleColumnIndex]: {
            cellWidth: titleColWidth,
            halign: "left",
            valign: "top",
            overflow: "linebreak",
          },
          2: { cellWidth: 24, halign: "left", valign: "middle" },
          3: { cellWidth: 24, halign: "left", valign: "middle" },
          [gapColumnIndex]: { cellWidth: 26, halign: "center", valign: "middle" },
          5: { cellWidth: 20, halign: "left", valign: "middle", overflow: "linebreak" },
        },
    bodyStyles: {
      minCellHeight: 12,
      halign: "left",
      overflow: "linebreak",
      fontStyle: "normal",
    },
    didParseCell: (data: {
      section: string
      row: { index: number }
      column: { index: number }
      cell: {
        styles: Record<string, unknown>
        text: string[]
      }
    }) => {
      // Consistent header alignment (Gap centered; everything else left)
      if (data.section === "head") {
        data.cell.styles.halign =
          data.column.index === gapColumnIndex ? "center" : "left"
        data.cell.styles.valign = "middle"
        data.cell.styles.overflow = "linebreak"
        return
      }

      if (data.section !== "body") return

      data.cell.styles.halign =
        data.column.index === gapColumnIndex ? "center" : "left"
      data.cell.styles.overflow = "linebreak"

      const meta = rowMetas[data.row.index]
      if (!meta) return

      if (meta.isUnitHeader && meta.headerTitle) {
        const fontSize = meta.headerFontSize ?? 9
        doc.setFont("helvetica", "bold")
        doc.setFontSize(fontSize)
        setPdfCharSpaceZero(doc)
        const { height } = getWrappedTextHeightMm(
          doc,
          meta.headerTitle,
          headerTextWidth,
          headerPadY,
        )
        data.cell.styles.minCellHeight = Math.max(12, height)
        data.cell.styles.valign = "middle"
        data.cell.text = [""]
        return
      }

      // Drive row height from the title column (longest wrapped content).
      // Apply the same min height on every cell so autotable cannot undersize
      // the row when other columns only contain short values.
      if (meta.cellTitle) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        setPdfCharSpaceZero(doc)
        const { height: titleHeight } = getWrappedTextHeightMm(
          doc,
          meta.cellTitle,
          titleTextWidth,
          titlePadY,
        )
        const rowMinHeight = Math.max(
          12,
          titleHeight,
          gapContentMinHeight(meta.evidenceCount ?? 0),
        )
        data.cell.styles.minCellHeight = rowMinHeight

        if (data.column.index === titleColumnIndex) {
          data.cell.styles.valign = "top"
          data.cell.text = [""]
        } else {
          data.cell.styles.valign = "middle"
        }
      }
    },
    didDrawCell: (data: {
      section: string
      row: { index: number }
      column: { index: number }
      cell: { x: number; y: number; width: number; height: number }
    }) => {
      if (data.section !== "body") return

      const meta = rowMetas[data.row.index]
      setPdfCharSpaceZero(doc)

      if (meta?.isUnitHeader && meta.headerTitle && data.column.index === 0) {
        const fontSize = meta.headerFontSize ?? 9
        doc.setFont("helvetica", "bold")
        doc.setFontSize(fontSize)
        doc.setTextColor(15, 23, 42)
        setPdfCharSpaceZero(doc)
        const { lines, lineHeight } = getWrappedTextHeightMm(
          doc,
          meta.headerTitle,
          data.cell.width - headerPadX * 2,
          headerPadY,
        )
        const visible = fitLinesToCellHeight(
          lines,
          data.cell.height,
          headerPadY,
          lineHeight,
        )
        doc.text(visible, data.cell.x + headerPadX, data.cell.y + headerPadY, {
          baseline: "top",
          align: "left",
        })
        return
      }

      if (meta?.cellTitle && data.column.index === titleColumnIndex) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        setPdfCharSpaceZero(doc)
        const { lines, lineHeight } = getWrappedTextHeightMm(
          doc,
          meta.cellTitle,
          data.cell.width - titlePadX * 2,
          titlePadY,
        )
        const visible = fitLinesToCellHeight(
          lines,
          data.cell.height,
          titlePadY,
          lineHeight,
        )
        doc.text(visible, data.cell.x + titlePadX, data.cell.y + titlePadY, {
          baseline: "top",
          align: "left",
        })
        return
      }

      if (meta?.isUnitHeader || data.column.index !== gapColumnIndex || !meta?.gap) {
        return
      }

      const evidenceCount = meta.evidenceCount ?? 0
      const showEvidence = evidenceCount > 0
      const boxWidth = Math.min(22, data.cell.width - 6)
      const boxHeight = 4.5
      const circleRadius = 1.15
      const circleGap = 1.1
      const circleCount = Math.min(evidenceCount, 3)
      const showCountLabel = evidenceCount > 3
      const evidenceBlockHeight = showEvidence
        ? circleRadius * 2 + (showCountLabel ? 3.2 : 0)
        : 0
      const contentHeight =
        boxHeight + (showEvidence ? 1.4 + evidenceBlockHeight : 0)
      const contentStartY =
        data.cell.y + Math.max(1.5, (data.cell.height - contentHeight) / 2)
      const boxX = data.cell.x + (data.cell.width - boxWidth) / 2
      const boxY = contentStartY
      const [r, g, b] = getGapPdfColor(meta.gap)

      doc.setFillColor(r, g, b)
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1, 1, "F")

      if (!showEvidence) return

      const primaryBlue: [number, number, number] = [0, 129, 204]
      const circlesWidth =
        circleCount * (circleRadius * 2) +
        Math.max(0, circleCount - 1) * circleGap +
        (showCountLabel ? 8 : 0)
      let circleX =
        data.cell.x + (data.cell.width - circlesWidth) / 2 + circleRadius
      const circleY = boxY + boxHeight + 1.4 + circleRadius

      // Keep evidence glyphs inside the cell when the row is short.
      if (circleY + circleRadius > data.cell.y + data.cell.height - 0.5) {
        return
      }

      doc.setFillColor(...primaryBlue)
      doc.setDrawColor(...primaryBlue)
      for (let i = 0; i < circleCount; i++) {
        doc.circle(circleX, circleY, circleRadius, "F")
        circleX += circleRadius * 2 + circleGap
      }

      if (showCountLabel) {
        doc.setFontSize(7)
        doc.setTextColor(...primaryBlue)
        doc.text(String(evidenceCount), circleX + 1, circleY + 1)
        doc.setTextColor(0, 0, 0)
      }
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
