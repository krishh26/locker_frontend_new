type CourseLike =
  | {
      course_name?: string | null
      level?: unknown
    }
  | null
  | undefined

/** Course levels are stored as "Entry Level" / "Level 3"; older data may hold a bare number. */
export const formatCourseLevel = (level?: unknown): string => {
  const value =
    typeof level === "string" || typeof level === "number" ? String(level).trim() : ""
  if (!value) return ""
  return /^\d+$/.test(value) ? `Level ${value}` : value
}

/** "Course name (Level 3)", so courses with the same name can be told apart. */
export const getCourseLabel = (course: CourseLike, fallback = ""): string => {
  const name = course?.course_name?.trim() || fallback
  const level = formatCourseLevel(course?.level)
  if (!name) return level
  return level ? `${name} (${level})` : name
}
