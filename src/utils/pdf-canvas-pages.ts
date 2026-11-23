/**
 * Paginate a tall html2canvas bitmap into A4 PDF pages without overlap/duplication.
 *
 * The common "shift full image with negative Y" approach draws the same canvas
 * pixels on adjacent pages and collides with footers. This helper crops each
 * page slice from the source canvas and places only that slice in the content area.
 */

type JsPdfLike = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
  addPage: () => unknown
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => unknown
  setFont: (face: string, style: string) => unknown
  setFontSize: (size: number) => unknown
  setTextColor: (r: number, g?: number, b?: number) => unknown
  setDrawColor: (r: number, g?: number, b?: number) => unknown
  setLineWidth: (w: number) => unknown
  text: (
    text: string,
    x: number,
    y: number,
    options?: { align?: "left" | "center" | "right" }
  ) => unknown
  line: (x1: number, y1: number, x2: number, y2: number) => unknown
}

export type AddCanvasAsPdfPagesOptions = {
  /** Left/right margin in mm */
  marginX?: number
  /** Top margin in mm (content start) */
  marginTop?: number
  /** Bottom margin reserved for footer in mm */
  marginBottom?: number
  /** Optional footer label (left side) */
  footerLabel?: string
  /** Fill behind each slice (avoids transparent gaps) */
  backgroundColor?: string
}

function createPageSlice(
  source: HTMLCanvasElement,
  srcY: number,
  sliceHeightPx: number,
  backgroundColor: string
): HTMLCanvasElement {
  const slice = document.createElement("canvas")
  slice.width = source.width
  slice.height = sliceHeightPx
  const ctx = slice.getContext("2d")
  if (!ctx) {
    throw new Error("Could not create canvas context for PDF page slice")
  }
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, slice.width, slice.height)
  ctx.drawImage(
    source,
    0,
    srcY,
    source.width,
    sliceHeightPx,
    0,
    0,
    source.width,
    sliceHeightPx
  )
  return slice
}

/**
 * Adds a captured canvas to `pdf` as one or more pages.
 * Returns the total number of pages written.
 */
export function addCanvasAsPdfPages(
  pdf: JsPdfLike,
  canvas: HTMLCanvasElement,
  options: AddCanvasAsPdfPagesOptions = {}
): number {
  const marginX = options.marginX ?? 12
  const marginTop = options.marginTop ?? 12
  const marginBottom = options.marginBottom ?? 16
  const backgroundColor = options.backgroundColor ?? "#ffffff"
  const footerLabel = options.footerLabel?.trim() || ""

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidthMm = pageWidth - marginX * 2
  const contentHeightMm = pageHeight - marginTop - marginBottom

  if (contentWidthMm <= 0 || contentHeightMm <= 0) {
    throw new Error("Invalid PDF content area: check margins")
  }

  // Convert mm content height to source canvas pixels at current draw scale
  const pxPerMm = canvas.width / contentWidthMm
  const pageSliceHeightPx = Math.max(1, Math.floor(contentHeightMm * pxPerMm))
  const totalPages = Math.max(1, Math.ceil(canvas.height / pageSliceHeightPx))

  const drawFooter = (pageNumber: number) => {
    const footerY = pageHeight - 7
    pdf.setDrawColor(203, 213, 225)
    pdf.setLineWidth(0.2)
    pdf.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11)

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(100)

    if (footerLabel) {
      const label =
        footerLabel.length > 52 ? `${footerLabel.slice(0, 49)}...` : footerLabel
      pdf.text(label, marginX, footerY, { align: "left" })
    }

    pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, {
      align: "right",
    })
  }

  let srcY = 0
  let pageNumber = 0

  while (srcY < canvas.height) {
    const remainingPx = canvas.height - srcY
    const sliceHeightPx = Math.min(pageSliceHeightPx, remainingPx)
    const slice = createPageSlice(canvas, srcY, sliceHeightPx, backgroundColor)
    const sliceHeightMm = sliceHeightPx / pxPerMm

    if (pageNumber > 0) {
      pdf.addPage()
    }

    pageNumber += 1
    pdf.addImage(
      slice.toDataURL("image/png"),
      "PNG",
      marginX,
      marginTop,
      contentWidthMm,
      sliceHeightMm
    )
    drawFooter(pageNumber)

    srcY += sliceHeightPx
  }

  // Empty document edge case
  if (pageNumber === 0) {
    drawFooter(1)
    return 1
  }

  return pageNumber
}
