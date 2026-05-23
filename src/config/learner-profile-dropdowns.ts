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
export const ETHNICITY_OPTIONS: LearnerProfileSelectOption[] = []

/** Learner disability — populate when DA provides list */
export const LEARNER_DISABILITY_OPTIONS: LearnerProfileSelectOption[] = []

/** Learning difficulties — populate when DA provides list */
export const LEARNING_DIFFICULTY_OPTIONS: LearnerProfileSelectOption[] = []

export function findLearnerProfileOption(
  options: LearnerProfileSelectOption[],
  value: string | undefined | null,
): LearnerProfileSelectOption | undefined {
  if (!value?.trim()) return undefined
  return options.find((o) => o.value === value)
}
