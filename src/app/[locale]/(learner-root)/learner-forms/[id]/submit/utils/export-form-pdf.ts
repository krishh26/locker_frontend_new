/**
 * Professional document-style PDF export for learner forms.
 * Renders labels + values as print text (not web input boxes).
 */

import DOMPurify from "dompurify"
import type { FormField, TableAnswer, TableConfig } from "@/store/api/forms/types"
import { resolveTemplate } from "@/components/forms/template-variables"
import { parseTableAnswer } from "@/components/forms/table-utils"
import { addCanvasAsPdfPages } from "@/utils/pdf-canvas-pages"

export const LEARNER_FORM_PDF_CONTENT_ID = "learner-form-pdf-content"

export type FormPdfSnapshot = {
  formName: string
  description?: string
  fields: FormField[]
  values: Record<string, unknown>
  templateValues?: Record<string, string | number | null | undefined>
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "form"
}

function formatExportDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function widthClass(width?: string): string {
  switch (width) {
    case "threeQuarters":
      return "w-75"
    case "twoThirds":
      return "w-66"
    case "half":
      return "w-50"
    case "third":
      return "w-33"
    case "quarter":
      return "w-25"
    default:
      return "w-100"
  }
}

function formatScalarValue(value: unknown): string {
  if (value == null) return ""
  if (value instanceof File) return value.name
  if (Array.isArray(value)) return value.filter(Boolean).map(String).join(", ")
  if (typeof value === "object") return ""
  return String(value).trim()
}

function isDataUrlImage(value: string): boolean {
  return /^data:image\//i.test(value)
}

function renderTableHtml(config: TableConfig | undefined, answer: TableAnswer): string {
  if (!config?.columns?.length || !config.rows?.length) return ""

  const head = config.showHeader
    ? `<thead><tr>${config.columns
        .map((c) => `<th>${escapeHtml(c.header || "")}</th>`)
        .join("")}</tr></thead>`
    : ""

  const body = `<tbody>${config.rows
    .map((row) => {
      const cells = config.columns
        .map((col) => {
          const cell = row.cells?.[col.id]
          const answered = answer?.[row.id]?.[col.id]
          let text = ""
          if (answered != null && String(answered).trim()) {
            text = String(answered)
          } else if (cell?.type === "static") {
            text = cell.text || ""
          } else if (cell?.type === "checkbox") {
            text =
              answered === "true" || answered === "1" || answered === "yes"
                ? "Yes"
                : answered
                  ? String(answered)
                  : "No"
          }
          return `<td>${escapeHtml(text)}</td>`
        })
        .join("")
      return `<tr>${cells}</tr>`
    })
    .join("")}</tbody>`

  return `<table class="pdf-table">${head}${body}</table>`
}

function renderFieldHtml(
  field: FormField,
  values: Record<string, unknown>,
  templateValues: Record<string, string | number | null | undefined>
): string {
  const type = field.type
  const raw = values[field.id]
  const cls = widthClass(field.width)

  if (type === "richtext") {
    const html = DOMPurify.sanitize(
      resolveTemplate(field.content || "", templateValues, (key) => key, true),
      { USE_PROFILES: { html: true } }
    )
    return `<div class="pdf-block ${cls} pdf-richtext">${html}</div>`
  }

  if (type === "statement") {
    const agreed = typeof raw === "string" && raw.trim().length > 0
    const text = agreed
      ? raw
      : resolveTemplate(field.content || "", templateValues, (key) => key, false)
    return `<div class="pdf-block ${cls} pdf-statement">
      <span class="pdf-check">${agreed ? "☑" : "☐"}</span>
      <span class="pdf-statement-text">${escapeHtml(String(text || ""))}</span>
    </div>`
  }

  if (type === "table") {
    const answer = parseTableAnswer(raw)
    return `<div class="pdf-block ${cls}">
      ${field.label ? `<div class="pdf-label">${escapeHtml(field.label)}</div>` : ""}
      ${renderTableHtml(field.table, answer)}
    </div>`
  }

  if (type === "signature") {
    const value = formatScalarValue(raw)
    const label = escapeHtml(field.label || "Signature")
    if (value && isDataUrlImage(value)) {
      return `<div class="pdf-block ${cls}">
        <div class="pdf-label">${label}</div>
        <div class="pdf-signature-box"><img src="${value}" alt="Signature" /></div>
      </div>`
    }
    return `<div class="pdf-block ${cls}">
      <div class="pdf-label">${label}</div>
      <div class="pdf-value-line">${escapeHtml(value)}</div>
    </div>`
  }

  if (type === "file" || type === "fileUpload" || type === "upload") {
    const value = formatScalarValue(raw)
    return `<div class="pdf-block ${cls}">
      <div class="pdf-label">${escapeHtml(field.label || "File")}</div>
      <div class="pdf-value-line">${escapeHtml(value || "—")}</div>
    </div>`
  }

  // Default answer fields: label + underlined value (document style)
  const value = formatScalarValue(raw)
  const label = escapeHtml(
    field.label ? `${field.label}${field.required ? " *" : ""}` : "Field"
  )
  return `<div class="pdf-block ${cls}">
    <div class="pdf-label">${label}</div>
    <div class="pdf-value-line">${escapeHtml(value) || "&nbsp;"}</div>
  </div>`
}

const PRINT_CSS = `
  #learner-form-pdf-print-root {
    position: fixed;
    left: -10000px;
    top: 0;
    width: 794px;
    background: #ffffff;
    color: #0f172a;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    font-size: 12.5px;
    line-height: 1.55;
    z-index: -1;
  }
  #learner-form-pdf-print-root, #learner-form-pdf-print-root * {
    box-sizing: border-box;
  }
  #learner-form-pdf-print-root .pdf-doc {
    padding: 40px 48px 56px;
    background: #ffffff;
  }
  #learner-form-pdf-print-root .pdf-header {
    border-bottom: 2.5px solid #0f766e;
    padding-bottom: 14px;
    margin-bottom: 22px;
  }
  #learner-form-pdf-print-root .pdf-header-brand {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #0f766e;
    margin-bottom: 6px;
  }
  #learner-form-pdf-print-root .pdf-header-title {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    line-height: 1.25;
  }
  #learner-form-pdf-print-root .pdf-header-meta {
    font-size: 11px;
    color: #64748b;
    margin: 0;
  }
  #learner-form-pdf-print-root .pdf-body {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    align-items: flex-start;
  }
  #learner-form-pdf-print-root .pdf-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  #learner-form-pdf-print-root .w-100 { width: 100%; }
  #learner-form-pdf-print-root .w-75 { width: calc(75% - 9px); }
  #learner-form-pdf-print-root .w-66 { width: calc(66.666% - 9px); }
  #learner-form-pdf-print-root .w-50 { width: calc(50% - 9px); }
  #learner-form-pdf-print-root .w-33 { width: calc(33.333% - 12px); }
  #learner-form-pdf-print-root .w-25 { width: calc(25% - 14px); }
  #learner-form-pdf-print-root .pdf-label {
    font-size: 11px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 2px;
  }
  #learner-form-pdf-print-root .pdf-value-line {
    min-height: 22px;
    padding: 2px 0 4px;
    border-bottom: 1px solid #94a3b8;
    color: #0f172a;
    font-size: 13px;
    word-break: break-word;
  }
  #learner-form-pdf-print-root .pdf-richtext {
    width: 100%;
    color: #0f172a;
    font-size: 12.5px;
    line-height: 1.6;
    margin: 4px 0 8px;
  }
  #learner-form-pdf-print-root .pdf-richtext p {
    margin: 0 0 0.65em;
  }
  #learner-form-pdf-print-root .pdf-richtext h1,
  #learner-form-pdf-print-root .pdf-richtext h2,
  #learner-form-pdf-print-root .pdf-richtext h3,
  #learner-form-pdf-print-root .pdf-richtext h4 {
    margin: 0.9em 0 0.4em;
    line-height: 1.3;
    color: #0f172a;
  }
  #learner-form-pdf-print-root .pdf-richtext h2 { font-size: 15px; }
  #learner-form-pdf-print-root .pdf-richtext h3 { font-size: 13.5px; }
  #learner-form-pdf-print-root .pdf-richtext ul,
  #learner-form-pdf-print-root .pdf-richtext ol {
    margin: 0.4em 0 0.8em;
    padding-left: 1.4em;
  }
  #learner-form-pdf-print-root .pdf-richtext li {
    margin: 0.2em 0;
    padding-left: 0.15em;
  }
  #learner-form-pdf-print-root .pdf-richtext strong { font-weight: 700; }
  #learner-form-pdf-print-root .pdf-statement {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    width: 100%;
    margin: 6px 0;
  }
  #learner-form-pdf-print-root .pdf-check {
    flex-shrink: 0;
    font-size: 14px;
    line-height: 1.4;
  }
  #learner-form-pdf-print-root .pdf-statement-text {
    flex: 1;
    font-size: 12.5px;
  }
  #learner-form-pdf-print-root .pdf-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 10px;
    font-size: 11px;
  }
  #learner-form-pdf-print-root .pdf-table th,
  #learner-form-pdf-print-root .pdf-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  #learner-form-pdf-print-root .pdf-table th {
    background: #f1f5f9;
    font-weight: 600;
  }
  #learner-form-pdf-print-root .pdf-signature-box {
    border: 1px solid #cbd5e1;
    border-radius: 2px;
    padding: 8px;
    min-height: 56px;
    display: inline-block;
    max-width: 280px;
  }
  #learner-form-pdf-print-root .pdf-signature-box img {
    max-width: 260px;
    max-height: 80px;
    display: block;
  }
`

function buildDocumentHtml(snapshot: FormPdfSnapshot): string {
  const templateValues = snapshot.templateValues || {}
  const fieldsHtml = snapshot.fields
    .map((field) => renderFieldHtml(field, snapshot.values, templateValues))
    .join("")

  const meta = [snapshot.description?.trim() || null, `Exported ${formatExportDate()}`]
    .filter(Boolean)
    .join("  ·  ")

  return `
    <div class="pdf-doc">
      <div class="pdf-header">
        <div class="pdf-header-brand">LOCKER</div>
        <h1 class="pdf-header-title">${escapeHtml(snapshot.formName)}</h1>
        <p class="pdf-header-meta">${escapeHtml(meta)}</p>
      </div>
      <div class="pdf-body">
        ${fieldsHtml}
      </div>
    </div>
  `
}

export async function exportLearnerFormToPdf(snapshot: FormPdfSnapshot): Promise<void> {
  const style = document.createElement("style")
  style.textContent = PRINT_CSS

  const root = document.createElement("div")
  root.id = "learner-form-pdf-print-root"
  root.innerHTML = buildDocumentHtml(snapshot)
  document.head.appendChild(style)
  document.body.appendChild(root)

  try {
    // Wait for signature images (if any) to load
    const images = Array.from(root.querySelectorAll("img"))
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve()
            else {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            }
          })
      )
    )

    const html2canvas = (await import("html2canvas-pro")).default
    const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js")

    const docEl = root.querySelector(".pdf-doc") as HTMLElement
    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      imageTimeout: 20000,
      windowWidth: 794,
    })

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })
    addCanvasAsPdfPages(pdf, canvas, {
      marginX: 12,
      marginTop: 12,
      marginBottom: 16,
      footerLabel: snapshot.formName,
      backgroundColor: "#ffffff",
    })

    const date = new Date().toISOString().split("T")[0]
    pdf.save(`${sanitizeFilename(snapshot.formName)}_${date}.pdf`)
  } finally {
    root.remove()
    style.remove()
  }
}
