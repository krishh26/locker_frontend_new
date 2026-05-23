/**
 * Evidence form helpers — built from canonical config.
 * Titles are resolved in UI via `useTranslations('assessmentMethods')`.
 */

import {
  STANDARD_ASSESSMENT_METHODS,
  assessmentMethodCodes,
  getAssessmentMethodByCode,
  normalizeAssessmentMethodCode,
} from "@/config/assessment-methods"

export interface AssessmentMethod {
  value: string
  title: string
}

/** Codes for evidence checkboxes (value = standard code). */
export const ASSESSMENT_METHOD_VALUES = assessmentMethodCodes

export function buildAssessmentMethodsForEvidence(
  getTitle: (code: string) => string,
): AssessmentMethod[] {
  return STANDARD_ASSESSMENT_METHODS.map((m) => ({
    value: m.code,
    title: getTitle(m.code),
  }))
}

export {
  getAssessmentMethodByCode,
  normalizeAssessmentMethodCode,
  mergeAssessmentMethodsForDisplay,
} from "@/config/assessment-methods"

export const getAssessmentMethodByValue = getAssessmentMethodByCode

export const getAssessmentMethodByTitle = (
  title: string,
): AssessmentMethod | undefined => {
  const found = STANDARD_ASSESSMENT_METHODS.find(
    (m) => m.code === title,
  )
  if (!found) return undefined
  return { value: found.code, title }
}

export const getAssessmentMethodTitles = (): string[] =>
  STANDARD_ASSESSMENT_METHODS.map((m) => m.code)

export const getAssessmentMethodValues = (): string[] => assessmentMethodCodes

/** @deprecated Use buildAssessmentMethodsForEvidence in components with i18n */
export const ASSESSMENT_METHODS: AssessmentMethod[] =
  STANDARD_ASSESSMENT_METHODS.map((m) => ({
    value: m.code,
    title: m.code,
  }))
