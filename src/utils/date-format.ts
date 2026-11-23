import { format, isValid } from "date-fns"

/** UK display date — use everywhere users see a full date. */
export const UK_DATE_FORMAT = "dd/MM/yyyy"

/** UK display date + 24h time. */
export const UK_DATETIME_FORMAT = "dd/MM/yyyy HH:mm"

/** ISO calendar date for `<input type="date">`, APIs, and storage keys. */
export const ISO_DATE_FORMAT = "yyyy-MM-dd"

function toValidDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null
  const date = typeof value === "string" ? new Date(value) : value
  return isValid(date) ? date : null
}

/** Format a value as UK `dd/MM/yyyy` for UI / CSV / PDF display. */
export function formatDateUK(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const date = toValidDate(value)
  return date ? format(date, UK_DATE_FORMAT) : fallback
}

/** Format a value as UK `dd/MM/yyyy HH:mm` for UI display. */
export function formatDateTimeUK(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const date = toValidDate(value)
  return date ? format(date, UK_DATETIME_FORMAT) : fallback
}

/** Format for HTML date inputs and API date-only fields (`yyyy-MM-dd`). */
export function formatDateISO(
  value: string | Date | null | undefined,
  fallback = "",
): string {
  const date = toValidDate(value)
  return date ? format(date, ISO_DATE_FORMAT) : fallback
}
