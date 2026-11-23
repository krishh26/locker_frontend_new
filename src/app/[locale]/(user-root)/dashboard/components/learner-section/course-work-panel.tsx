"use client"

import { useMemo, useState } from "react"
import { addMonths, differenceInCalendarMonths, format } from "date-fns"
import {
  CalendarClock,
  FilePenLine,
  Upload,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useGetEvidenceListQuery } from "@/store/api/evidence/evidenceApi"
import type { EvidenceEntry } from "@/store/api/evidence/types"
import type { LearnerCourse } from "@/store/api/learner/types"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { selectLearner } from "@/store/slices/authSlice"
import { setCurrentCourseId } from "@/store/slices/courseSlice"

type SubmissionFilter = "all" | "not_submitted" | "submitted"
/** due = within schedule window; overdue = past monthly due date with no upload */
type CourseWorkStatus = "due" | "overdue" | "submitted"

type CourseWorkItem = {
  id: string
  title: string
  courseId: number
  courseLabel: string
  pointsLabel: string
  deadline: Date | null
  status: CourseWorkStatus
  kind: "assignment" | "evidence"
  assignmentIndex?: number
  evidenceId?: number
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Expected assignment count = months on the qualification (1 per month),
 * falling back to unit count when dates are missing.
 */
function getExpectedAssignmentCount(enrollment: LearnerCourse): number {
  const start = parseDate(enrollment.start_date)
  const end = parseDate(enrollment.end_date)

  if (start && end && end > start) {
    const months = Math.max(1, differenceInCalendarMonths(end, start))
    return months
  }

  const units =
    Number(enrollment.totalUnits ?? 0) ||
    Number(enrollment.unitsNotStarted ?? 0) +
      Number(enrollment.unitsFullyCompleted ?? 0) +
      Number(enrollment.unitsPartiallyCompleted ?? 0)

  return Math.max(1, units || 1)
}

/** Assignment i (1-based) is due one month after start, capped at course end. */
function getAssignmentDueDate(
  enrollment: LearnerCourse,
  assignmentIndex: number,
  expectedCount: number
): Date | null {
  const start = parseDate(enrollment.start_date)
  const end = parseDate(enrollment.end_date)
  if (!start) return end ? endOfDay(end) : null

  let due = endOfDay(addMonths(start, assignmentIndex))
  if (end && due > end) {
    due = endOfDay(end)
  }

  // Last assignment aligns to course end when months don't divide evenly
  if (assignmentIndex === expectedCount && end) {
    due = endOfDay(end)
  }

  return due
}

function getEvidenceCourseId(entry: EvidenceEntry): number | null {
  const mapped = entry.mappings?.find((m) => m.course?.course_id || m.course_id)
  const courseId =
    mapped?.course?.course_id ??
    mapped?.course_id ??
    entry.course_id?.course_id ??
    null
  return courseId != null ? Number(courseId) : null
}

function formatDeadline(date: Date | null): string {
  if (!date) return "—"
  return format(date, "dd/MM/yyyy HH:mm")
}

interface CourseWorkPanelProps {
  courses: LearnerCourse[]
}

export function CourseWorkPanel({ courses }: CourseWorkPanelProps) {
  const t = useTranslations("learnerDashboard.courseWork")
  const router = useRouter()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector(selectLearner)

  const targetUserId = String(
    user?.role === "Learner"
      ? user?.id ?? ""
      : (learner as { id?: string | number; user_id?: string | number } | null)
          ?.id ??
          (learner as { user_id?: string | number } | null)?.user_id ??
          user?.id ??
          ""
  )

  const [showSummary, setShowSummary] = useState(true)
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<SubmissionFilter>("not_submitted")

  const { data: evidenceData, isLoading: evidenceLoading } =
    useGetEvidenceListQuery(
      { user_id: targetUserId, page: 1, limit: 500, meta: true },
      { skip: !targetUserId }
    )

  const evidenceItems = useMemo(
    () => evidenceData?.data ?? [],
    [evidenceData?.data]
  )

  const evidenceByCourse = useMemo(() => {
    const map = new Map<number, EvidenceEntry[]>()
    for (const entry of evidenceItems) {
      const courseId = getEvidenceCourseId(entry)
      if (courseId == null) continue
      const list = map.get(courseId) ?? []
      list.push(entry)
      map.set(courseId, list)
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }
    return map
  }, [evidenceItems])

  const allItems = useMemo(() => {
    const items: CourseWorkItem[] = []
    const now = Date.now()

    for (const enrollment of courses) {
      const course = enrollment.course
      if (!course?.course_id) continue
      if (course.active === false) continue

      const courseId = course.course_id
      const expected = getExpectedAssignmentCount(enrollment)
      const uploads = evidenceByCourse.get(courseId) ?? []
      const uploadedCount = uploads.length
      const outstanding = Math.max(expected - uploadedCount, 0)
      const courseName = course.course_name || course.course_code
      const courseCode = course.course_code || course.course_name
      const outstandingLabel = t("assignmentsOutstanding", {
        count: outstanding,
      })

      for (let index = 1; index <= expected; index += 1) {
        const deadline = getAssignmentDueDate(enrollment, index, expected)
        const matchedEvidence = uploads[index - 1]
        const isSubmitted = index <= uploadedCount

        if (isSubmitted && matchedEvidence) {
          items.push({
            id: `assignment-${courseId}-${index}`,
            title: courseName,
            courseId,
            courseLabel: courseCode,
            pointsLabel: t("assignmentOf", {
              index,
              total: expected,
            }),
            deadline:
              parseDate(matchedEvidence.created_at) ||
              deadline,
            status: "submitted",
            kind: "evidence",
            assignmentIndex: index,
            evidenceId: matchedEvidence.assignment_id,
          })
          continue
        }

        if (isSubmitted) {
          items.push({
            id: `assignment-${courseId}-${index}`,
            title: courseName,
            courseId,
            courseLabel: courseCode,
            pointsLabel: t("assignmentOf", {
              index,
              total: expected,
            }),
            deadline,
            status: "submitted",
            kind: "assignment",
            assignmentIndex: index,
          })
          continue
        }

        const dueMs = deadline?.getTime()
        const status: CourseWorkStatus =
          dueMs != null && now > dueMs ? "overdue" : "due"

        items.push({
          id: `assignment-${courseId}-${index}`,
          title: courseName,
          courseId,
          courseLabel: courseCode,
          pointsLabel: outstandingLabel,
          deadline,
          status,
          kind: "assignment",
          assignmentIndex: index,
        })
      }
    }

    return items.sort((a, b) => {
      const aTime = a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER
      const bTime = b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }, [courses, evidenceByCourse, t])

  const counts = useMemo(() => {
    const scoped =
      courseFilter === "all"
        ? allItems
        : allItems.filter((item) => String(item.courseId) === courseFilter)

    return {
      due: scoped.filter((i) => i.status === "due").length,
      overdue: scoped.filter((i) => i.status === "overdue").length,
      submitted: scoped.filter((i) => i.status === "submitted").length,
    }
  }, [allItems, courseFilter])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (courseFilter !== "all" && String(item.courseId) !== courseFilter) {
        return false
      }
      if (statusFilter === "not_submitted") {
        return item.status === "due" || item.status === "overdue"
      }
      if (statusFilter === "submitted") {
        return item.status === "submitted"
      }
      return true
    })
  }, [allItems, courseFilter, statusFilter])

  const goToAssignment = (item: CourseWorkItem) => {
    dispatch(setCurrentCourseId(item.courseId))
    router.push(`/resources?course_id=${item.courseId}`)
  }

  const goToUpload = (courseId: number) => {
    dispatch(setCurrentCourseId(courseId))
    router.push(`/evidence-library/new?course_id=${courseId}`)
  }

  const assignmentHref = (item: CourseWorkItem) =>
    `/resources?course_id=${item.courseId}`

  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="course-work-summary-toggle"
              className="text-sm font-normal text-muted-foreground"
            >
              {t("showSummaryCounts")}
            </Label>
            <Switch
              id="course-work-summary-toggle"
              checked={showSummary}
              onCheckedChange={setShowSummary}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("courseFilter")}
            </Label>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("allCourses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCourses")}</SelectItem>
                {courses.map((enrollment) => {
                  const course = enrollment.course
                  if (!course?.course_id) return null
                  return (
                    <SelectItem
                      key={course.course_id}
                      value={String(course.course_id)}
                    >
                      {[course.course_code, course.course_name]
                        .filter(Boolean)
                        .join(" — ")}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t("submissionStatus")}
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as SubmissionFilter)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("notSubmitted")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="not_submitted">{t("notSubmitted")}</SelectItem>
                <SelectItem value="submitted">{t("submitted")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showSummary && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {counts.due}
              </p>
              <p className="text-sm text-blue-700/80 dark:text-blue-300/80">
                {t("due")}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {counts.overdue}
              </p>
              <p className="text-sm text-red-700/80 dark:text-red-300/80">
                {t("overdue")}
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {counts.submitted}
              </p>
              <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
                {t("submitted")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t">
        {evidenceLoading && filteredItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("loading")}
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ul className="divide-y">
            {filteredItems.map((item) => {
              const isPending =
                item.status === "overdue" || item.status === "due"
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <button
                    type="button"
                    onClick={() => goToAssignment(item)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <FilePenLine className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold text-red-600 dark:text-red-400">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="truncate">{item.courseLabel}</span>
                        <span className="mx-1.5 text-muted-foreground/60">
                          |
                        </span>
                        <Link
                          href={assignmentHref(item)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          {t("goToAssignment")}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.pointsLabel}
                        {item.status === "overdue" ? (
                          <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                            · {t("overdue")}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge
                      variant="secondary"
                      className="gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sky-800 dark:bg-sky-950 dark:text-sky-200"
                    >
                      <CalendarClock className="size-3.5" />
                      {formatDeadline(item.deadline)}
                    </Badge>
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => goToUpload(item.courseId)}
                      >
                        <Upload className="size-3.5" />
                        {t("uploadWork")}
                      </Button>
                    )}
                    {!isPending && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => goToAssignment(item)}
                      >
                        {t("goToAssignment")}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
