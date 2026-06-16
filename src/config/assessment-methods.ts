/**
 * Canonical assessment methods (11) — single source of truth for the app.
 * Display codes: PE, DO, WT, … Trainer Risk Rating API uses lowercase `apiKey`.
 */

export interface StandardAssessmentMethod {
  code: string
  apiKey: string
}

export const STANDARD_ASSESSMENT_METHODS: readonly StandardAssessmentMethod[] = [
  { code: "PE", apiKey: "pe" },
  { code: "DO", apiKey: "do" },
  { code: "WT", apiKey: "wt" },
  { code: "QA", apiKey: "qa" },
  { code: "PS", apiKey: "ps" },
  { code: "DI", apiKey: "di" },
  { code: "SI", apiKey: "si" },
  { code: "ET", apiKey: "ee" },
  { code: "RA", apiKey: "ba" },
  { code: "OT", apiKey: "ot" },
  { code: "RPL", apiKey: "ipl" },
] as const

/** Retired codes — stripped from UI and payloads (legacy API data may still contain them). */
const DEPRECATED_ASSESSMENT_METHOD_CODES = new Set(["LO", "lo", "LB", "lb"])

export type AssessmentMethodCode =
  (typeof STANDARD_ASSESSMENT_METHODS)[number]["code"]

export const assessmentMethodCodes = STANDARD_ASSESSMENT_METHODS.map(
  (m) => m.code,
)

export const assessmentMethodApiKeys = STANDARD_ASSESSMENT_METHODS.map(
  (m) => m.apiKey,
)

const codeSet = new Set(assessmentMethodCodes)
const apiKeyToCode = new Map(
  STANDARD_ASSESSMENT_METHODS.map((m) => [m.apiKey, m.code]),
)
const codeToApiKey = new Map(
  STANDARD_ASSESSMENT_METHODS.map((m) => [m.code, m.apiKey]),
)

/** Legacy QA Sample Plan codes (pre-unification). */
const LEGACY_QA_CODE_ALIASES: Record<string, AssessmentMethodCode> = {
  WO: "DO",
  WP: "PS",
  PW: "PS",
  VI: "QA",
  PD: "PE",
  PT: "DO",
  TE: "ET",
  RJ: "RA",
}

/** Legacy evidence-library codes (pre-unification). */
const LEGACY_EVIDENCE_CODE_ALIASES: Record<string, AssessmentMethodCode> = {
  Obs: "DO",
  PA: "DO",
  ET: "ET",
  PD: "PE",
  I: "DI",
  "Q&A": "QA",
  P: "PS",
  RA: "RA",
  WT: "WT",
  PE: "PE",
  SI: "SI",
  OT: "OT",
  RPL: "RPL",
}

export function normalizeAssessmentMethodCode(
  raw: string,
): AssessmentMethodCode | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  const upper = trimmed.toUpperCase()
  if (codeSet.has(upper)) return upper as AssessmentMethodCode
  const fromLegacyQa = LEGACY_QA_CODE_ALIASES[trimmed] ?? LEGACY_QA_CODE_ALIASES[upper]
  if (fromLegacyQa) return fromLegacyQa
  const fromLegacyEvidence =
    LEGACY_EVIDENCE_CODE_ALIASES[trimmed] ??
    LEGACY_EVIDENCE_CODE_ALIASES[upper]
  if (fromLegacyEvidence) return fromLegacyEvidence
  const fromApiKey = apiKeyToCode.get(trimmed.toLowerCase())
  if (fromApiKey) return fromApiKey
  return null
}

export function getAssessmentMethodByCode(
  code: string,
): StandardAssessmentMethod | undefined {
  const normalized = normalizeAssessmentMethodCode(code)
  if (!normalized) return undefined
  return STANDARD_ASSESSMENT_METHODS.find((m) => m.code === normalized)
}

export function getAssessmentMethodByApiKey(
  apiKey: string,
): StandardAssessmentMethod | undefined {
  return STANDARD_ASSESSMENT_METHODS.find((m) => m.apiKey === apiKey)
}

export function codeToTrainerApiKey(code: string): string {
  return codeToApiKey.get(code) ?? code.toLowerCase()
}

/** QA / sample-plan payloads use uppercase codes as keys. */
export function buildAssessmentMethodsPayload(
  selectedCodes: string[],
): Record<string, boolean> {
  const normalizedSelected = new Set<AssessmentMethodCode>()
  const legacySelected: string[] = []

  for (const raw of selectedCodes) {
    const normalized = normalizeAssessmentMethodCode(raw)
    if (normalized) {
      normalizedSelected.add(normalized)
    } else if (raw?.trim()) {
      legacySelected.push(raw.trim())
    }
  }

  const payload: Record<string, boolean> = {}
  for (const method of STANDARD_ASSESSMENT_METHODS) {
    payload[method.code] = normalizedSelected.has(method.code)
  }
  for (const legacy of legacySelected) {
    if (!(legacy in payload)) {
      payload[legacy] = true
    }
  }
  return payload
}

/** Selected codes for checkboxes: standard codes + any legacy keys still on record. */
export function assessmentMethodsSelectionFromApi(
  raw: unknown,
): string[] {
  return mergeAssessmentMethodsForDisplay(parseAssessmentMethodsFromApi(raw))
}

/**
 * Parse API `assessment_methods` object or string array into codes.
 * Preserves unknown legacy keys as-is so saves do not drop data.
 */
export function parseAssessmentMethodsFromApi(
  raw: unknown,
): string[] {
  if (raw == null) return []

  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .filter(([, value]) => value === true)
      .map(([key]) => key)
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  return []
}

/**
 * Normalize selected codes to standard codes where possible; keep unknown legacy codes.
 */
export function mergeAssessmentMethodsForDisplay(
  codes: string[],
): string[] {
  const result = new Set<string>()
  for (const code of codes) {
    const trimmed = code.trim()
    if (!trimmed || DEPRECATED_ASSESSMENT_METHOD_CODES.has(trimmed)) continue
    const normalized = normalizeAssessmentMethodCode(code)
    if (normalized) {
      if (!DEPRECATED_ASSESSMENT_METHOD_CODES.has(normalized)) {
        result.add(normalized)
      }
    } else {
      result.add(trimmed)
    }
  }
  return Array.from(result)
}

/** For QA constants compatibility */
export interface AssessmentMethod {
  code: string
  title: string
  assessmentMethodId?: string
}

export function toQaAssessmentMethodList(
  getTitle: (code: AssessmentMethodCode) => string,
): AssessmentMethod[] {
  return STANDARD_ASSESSMENT_METHODS.map((m) => ({
    code: m.code,
    title: getTitle(m.code as AssessmentMethodCode),
    assessmentMethodId: m.code,
  }))
}

/** Static list for Redux defaults; use i18n for display titles in UI. */
export const assessmentMethods: AssessmentMethod[] =
  STANDARD_ASSESSMENT_METHODS.map((m) => ({
    code: m.code,
    title: m.code,
    assessmentMethodId: m.code,
  }))

export const assessmentMethodCodesForPayload = assessmentMethodCodes

export function getAssessmentMethodById(
  id: string,
): AssessmentMethod | undefined {
  const method = getAssessmentMethodByCode(id)
  if (!method) return undefined
  return {
    code: method.code,
    title: method.code,
    assessmentMethodId: method.code,
  }
}
