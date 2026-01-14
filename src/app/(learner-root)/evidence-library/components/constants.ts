/**
 * Constants for Evidence Library
 * Centralized constants to avoid magic strings throughout the codebase
 */

export const COURSE_TYPES = {
  STANDARD: 'Standard',
  QUALIFICATION: 'Qualification',
  GATEWAY: 'Gateway',
  MODULE_BASED: 'Module Based',
} as const

export type CourseType = typeof COURSE_TYPES[keyof typeof COURSE_TYPES]

