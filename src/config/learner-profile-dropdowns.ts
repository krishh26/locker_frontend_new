/**
 * Learner profile dropdown options — values to be supplied by DA / admin configuration.
 * Add entries to each array when option lists are confirmed.
 */

export const LEARNER_PROFILE_SELECT_EMPTY = "__none__"

export interface LearnerProfileSelectOption {
  /** Stored value (sent to API) */
  value: string
  /** Display label when not using i18n */
  label?: string
  /** Optional key under `learnerProfile.dropdowns.*` */
  labelKey?: string
}

/** Ethnicity — populate when DA provides list */
export const ETHNICITY_OPTIONS: LearnerProfileSelectOption[] = [
  { value: "31", label: "English / Welsh / Scottish / Northern Irish / British" },
  { value: "32", label: "Irish" },
  { value: "33", label: "Gypsy or Irish Traveller" },
  { value: "34", label: "Any Other White background" },
  { value: "35", label: "White and Black Caribbean" },
  { value: "36", label: "White and Black African" },
  { value: "37", label: "White and Asian" },
  { value: "38", label: "Any Other Mixed / multiple ethnic background" },
  { value: "39", label: "Indian" },
  { value: "40", label: "Pakistani" },
  { value: "41", label: "Bangladeshi" },
  { value: "42", label: "Chinese" },
  { value: "43", label: "Any other Asian background" },
  { value: "44", label: "African" },
  { value: "45", label: "Caribbean" },
  { value: "46", label: "Any other Black / African / Caribbean background" },
  { value: "47", label: "Arab" },
  { value: "98", label: "Any other ethnic group" },
  { value: "99", label: "Not provided / Refused" },
]

/**
 * LLDD (Learner Learning Difficulty/Disability).
 * Codes 1–3 are "NO LONGER IN USE" and are intentionally omitted.
 */
export const LLDD_OPTIONS: LearnerProfileSelectOption[] = [
  { value: "4", label: "Vision impairment" },
  { value: "5", label: "Hearing impairment" },
  { value: "6", label: "Disability affecting mobility" },
  { value: "7", label: "Profound complex disabilities" },
  { value: "8", label: "Social and emotional difficulties" },
  { value: "9", label: "Mental health difficulty" },
  { value: "10", label: "Moderate learning difficulty" },
  { value: "11", label: "Severe learning difficulty" },
  { value: "12", label: "Dyslexia" },
  { value: "13", label: "Dyscalculia" },
  { value: "14", label: "Autism spectrum disorder" },
  { value: "15", label: "Asperger's syndrome" },
  { value: "16", label: "Temporary disability after illness (for example post-viral) or accident" },
  { value: "17", label: "Speech, Language and Communication Needs" },
  { value: "93", label: "Other physical disability" },
  { value: "94", label: "Other specific learning difficulty (e.g. Dyspraxia)" },
  { value: "95", label: "Other medical condition (for example epilepsy, asthma, diabetes)" },
  { value: "96", label: "Other learning difficulty" },
  { value: "97", label: "Other disability" },
  { value: "98", label: "Prefer not to say" },
  { value: "99", label: "Not provided" },
]

/** Learner disability — LLDD list */
export const LEARNER_DISABILITY_OPTIONS: LearnerProfileSelectOption[] = LLDD_OPTIONS

/** Learning difficulties — LLDD list */
export const LEARNING_DIFFICULTY_OPTIONS: LearnerProfileSelectOption[] = LLDD_OPTIONS

export function findLearnerProfileOption(
  options: LearnerProfileSelectOption[],
  value: string | undefined | null,
): LearnerProfileSelectOption | undefined {
  if (!value?.trim()) return undefined
  return options.find((o) => o.value === value)
}
