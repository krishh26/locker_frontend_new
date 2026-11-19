"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
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
import { cn } from "@/lib/utils"
import { useGetEvidenceListQuery } from "@/store/api/evidence/evidenceApi"
import type { EvidenceEntry } from "@/store/api/evidence/types"
import type { LearnerCourse } from "@/store/api/learner/types"
import { useAppSelector } from "@/store/hooks"
import { selectLearner } from "@/store/slices/authSlice"

type SubmissionFilter = "all" | "not_submitted" | "submitted"
type CourseWorkStatus = "due" | "missing" | "submitted"

type CourseWorkItem = {
  id: string
  title: string
  courseId: number
  courseLabel: string
  pointsLabel: string
  deadline: Date | null
  status: CourseWorkStatus
  kind: "course" | "evidence"
  evidenceId?: number
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}

function getCourseProgress(course: LearnerCourse) {
  const total =
    Number(course.totalUnits ?? 0) ||
    Number(course.unitsNotStarted ?? 0) +
      Number(course.unitsFullyCompleted ?? 0) +
      Number(course.unitsPartiallyCompleted ?? 0)
  const completed = Number(course.unitsFullyCompleted ?? 0)
  const notStarted = Number(course.unitsNotStarted ?? 0)
  const partial = Number(course.unitsPartiallyCompleted ?? 0)
  return { total, completed, notStarted, partial }
}

function getCourseStatus(course: LearnerCourse, now = Date.now()): CourseWorkStatus {
  const { total, completed, notStarted, partial } = getCourseProgress(course)
  const end = parseDate(course.end_date)
  const fullyDone = total > 0 && completed >= total && partial === 0 && notStarted === 0

  if (fullyDone) return "submitted"

  if (end) {
    const msLeft = end.getTime() - now
    if (msLeft < 0) return "missing"
    const fourteenDays = 14 * 24 * 60 * 60 * 1000
    if (msLeft <= fourteenDays) return "due"
  }

  if (notStarted > 0 || partial > 0 || (total > 0 && completed < total)) {
    return "missing"
  }

  // No unit data yet — treat open enrollments as missing work
  return "missing"
}

function getEvidenceCourse(entry: EvidenceEntry): {
  courseId: number | null
  label: string
} {
  const mapped = entry.mappings?.find((m) => m.course?.course_id || m.course_id)
  const courseId =
    mapped?.course?.course_id ??
    mapped?.course_id ??
    entry.course_id?.course_id ??
    null
  const code = mapped?.course?.course_code || entry.course_id?.course_code || ""
  const name = mapped?.course?.course_name || entry.course_id?.course_name || ""
  const label = [code, name].filter(Boolean).join(" ") || "—"
  return { courseId: courseId != null ? Number(courseId) : null, label }
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

  const evidenceItems = useMemo(() => evidenceData?.data ?? [], [evidenceData?.data])

  const allItems = useMemo(() => {
    const items: CourseWorkItem[] = []

    for (const enrollment of courses) {
      const course = enrollment.course
      if (!course?.course_id) continue
      if (course.active === false) continue

      const status = getCourseStatus(enrollment)
      if (status === "submitted") continue

      const { total, completed } = getCourseProgress(enrollment)
      const remaining = Math.max(total - completed, 0)

      items.push({
        id: `course-${course.course_id}`,
        title: course.course_code || course.course_name,
        courseId: course.course_id,
        courseLabel: [course.course_code, course.course_name]
          .filter(Boolean)
          .join(" "),
        pointsLabel:
          total > 0
            ? t("unitsRemaining", { count: remaining || total })
            : t("uploadRemaining"),
        deadline: parseDate(enrollment.end_date),
        status,
        kind: "course",
      })
    }

    for (const entry of evidenceItems) {
      const { courseId, label } = getEvidenceCourse(entry)
      if (courseId == null) continue

      items.push({
        id: `evidence-${entry.assignment_id}`,
        title: entry.title?.trim() || t("untitledEvidence"),
        courseId,
        courseLabel: label,
        pointsLabel: entry.grade?.trim()
          ? t("gradeLabel", { grade: entry.grade })
          : t("submittedEvidence"),
        deadline: parseDate(entry.updated_at || entry.created_at),
        status: "submitted",
        kind: "evidence",
        evidenceId: entry.assignment_id,
      })
    }

    return items.sort((a, b) => {
      const aTime = a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER
      const bTime = b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
  }, [courses, evidenceItems, t])

  const counts = useMemo(() => {
    const scoped =
      courseFilter === "all"
        ? allItems
        : allItems.filter((item) => String(item.courseId) === courseFilter)

    return {
      due: scoped.filter((i) => i.status === "due").length,
      missing: scoped.filter((i) => i.status === "missing").length,
      submitted: scoped.filter((i) => i.status === "submitted").length,
    }
  }, [allItems, courseFilter])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (courseFilter !== "all" && String(item.courseId) !== courseFilter) {
        return false
      }
      if (statusFilter === "not_submitted") {
        return item.status === "due" || item.status === "missing"
      }
      if (statusFilter === "submitted") {
        return item.status === "submitted"
      }
      return true
    })
  }, [allItems, courseFilter, statusFilter])

  const goToCourse = (courseId: number) => {
    router.push(`/course-details/${courseId}`)
  }

  const goToUpload = (courseId: number) => {
    router.push(`/evidence-library/new?course_id=${courseId}`)
  }

  const openItem = (item: CourseWorkItem) => {
    if (item.kind === "evidence" && item.evidenceId) {
      router.push(`/evidence-library/${item.evidenceId}/view`)
      return
    }
    goToUpload(item.courseId)
  }

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
                {counts.missing}
              </p>
              <p className="text-sm text-red-700/80 dark:text-red-300/80">
                {t("missing")}
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
                item.status === "missing" || item.status === "due"
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                      <FilePenLine className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          "truncate font-semibold",
                          isPending
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground"
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="truncate">{item.courseLabel}</span>
                        <span className="mx-1.5 text-muted-foreground/60">
                          |
                        </span>
                        <Link
                          href={`/course-details/${item.courseId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          {t("goToCourse")}
                        </Link>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.pointsLabel}
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
                        onClick={() => goToCourse(item.courseId)}
                      >
                        {t("goToCourse")}
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
