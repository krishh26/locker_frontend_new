/**
 * Distinct folder colors for Learner Management Course column.
 * Same category → same color across all learners.
 * Hex values (inline style) so colors always apply regardless of Tailwind purge.
 */

type CourseColorSource = {
  course_type?: string | null
  course_core_type?: string | null
  course_name?: string | null
} | null | undefined

/** High-contrast palette — easy to tell types apart at a glance. */
const FOLDER_COLOR = {
  qualification: "#ef4444", // red
  standard: "#eab308", // yellow
  fsMaths: "#2563eb", // blue
  fsEnglish: "#10b981", // green
  powerUp: "#8b5cf6", // violet
  fallback: "#94a3b8", // slate
} as const

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLowerCase()
}

/** Prefer specific course_type / name matches, then course_core_type. */
export function getCourseFolderColor(course: CourseColorSource): string {
  const type = normalize(course?.course_type)
  const name = normalize(course?.course_name)
  const core = normalize(course?.course_core_type)
  const haystack = `${type} ${name}`

  if (
    type === "functional skills - maths" ||
    (type.includes("functional skills") && type.includes("math"))
  ) {
    return FOLDER_COLOR.fsMaths
  }
  if (
    type === "functional skills english" ||
    (type.includes("functional skills") && type.includes("english"))
  ) {
    return FOLDER_COLOR.fsEnglish
  }
  if (haystack.includes("power up") || haystack.includes("powerup")) {
    return FOLDER_COLOR.powerUp
  }
  if (core === "qualification") return FOLDER_COLOR.qualification
  if (core === "standard") return FOLDER_COLOR.standard

  if (name.includes("functional skills") && name.includes("math")) {
    return FOLDER_COLOR.fsMaths
  }
  if (name.includes("functional skills") && name.includes("english")) {
    return FOLDER_COLOR.fsEnglish
  }

  return FOLDER_COLOR.fallback
}
