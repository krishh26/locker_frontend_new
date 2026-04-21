"use client"

import { useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useAppDispatch } from "@/store/hooks"
import { setCurrentCourseId } from "@/store/slices/courseSlice"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Flag, CalendarDays, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { isEnrollmentExcluded } from "@/lib/is-enrollment-excluded"

interface Course {
  user_course_id?: number
  is_excluded?: boolean
  course?: {
    course_id?: number
    course_name: string
    course_core_type?: string
    questions?: Array<{ achieved?: boolean }>
    is_excluded?: boolean
  }
  start_date?: string
  end_date?: string
  questions?: Array<{
    achieved?: boolean
  }>
  unitsNotStarted?: number
  unitsFullyCompleted?: number
  unitsPartiallyCompleted?: number
  totalUnits?: number
}

interface CourseProgressChartsProps {
  courses: Course[]
}

const cardBgColors = [
  "bg-primary border-primary",
  "bg-accent border-accent",
  "bg-secondary border-secondary",
  "bg-primary border-primary",
  "bg-muted border-border",
  "bg-accent border-accent",
  "bg-secondary border-secondary",
  "bg-primary border-primary",
]

const CHART_COLORS = {
  duration: "#1E51F1",
  wip: "#FFCC33",
  notStarted: "#FF3B30",
  completed: "#1A6B3A",
} as const

/** Remaining time arc: light fill (not theme muted, which reads as black on some themes). */
const DURATION_REMAINING_FILL = "#FFFFFF"
const INNER_PLACEHOLDER_FILL = "hsl(var(--muted))"

const statsBgColors = [
  "border-primary/20 bg-primary/5",
  "border-accent/20 bg-accent/5",
  "border-secondary/20 bg-secondary/5",
  "border-primary/20 bg-primary/5",
  "border-border bg-muted/50",
  "border-accent/20 bg-accent/5",
  "border-secondary/20 bg-secondary/5",
  "border-primary/20 bg-primary/5",
]

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function parseTime(iso?: string): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : null
}

type InnerSegmentKey = "wip" | "notStarted" | "completed" | "empty"

interface NestedChartMetrics {
  showOuter: boolean
  durationPercent: number
  daysLeft: number | null
  hasValidEnd: boolean
  innerParts: Array<{ key: InnerSegmentKey; value: number; color: string }>
}

function getNestedChartMetrics(course: Course, nowMs = Date.now()): NestedChartMetrics {
  const startT = parseTime(course.start_date)
  const endT = parseTime(course.end_date)
  const hasValidEnd = endT !== null
  const hasValidStart = startT !== null
  const rangeOk =
    hasValidStart &&
    hasValidEnd &&
    endT! > startT!

  let durationPercent = 0
  if (rangeOk) {
    const total = endT! - startT!
    const elapsed = Math.min(Math.max(nowMs - startT!, 0), total)
    durationPercent = total > 0 ? (elapsed / total) * 100 : 0
  }

  const showOuter = rangeOk

  let daysLeft: number | null = null
  if (hasValidEnd && endT !== null) {
    const endDate = new Date(endT)
    const today = startOfLocalDay(new Date(nowMs))
    const endDay = startOfLocalDay(endDate)
    daysLeft = Math.max(0, Math.ceil((endDay - today) / 86_400_000))
  }

  let wip = 0
  let notStarted = 0
  let completed = 0

  try {
    const coreType = course?.course?.course_core_type
    const isGateway = coreType === "Gateway"
    const courseWithQuestions = course as {
      course?: { questions?: Array<{ achieved?: boolean }> }
      questions?: Array<{ achieved?: boolean }>
    }
    const questions = Array.isArray(courseWithQuestions?.course?.questions)
      ? courseWithQuestions.course?.questions ?? []
      : Array.isArray(courseWithQuestions?.questions)
        ? courseWithQuestions.questions ?? []
        : []

    if (isGateway && questions.length > 0) {
      completed = questions.filter((q) => q?.achieved === true).length
      notStarted = Math.max(0, questions.length - completed)
      wip = 0
    } else {
      wip = course.unitsPartiallyCompleted ?? 0
      notStarted = course.unitsNotStarted ?? 0
      completed = course.unitsFullyCompleted ?? 0
    }
  } catch {
    wip = course.unitsPartiallyCompleted ?? 0
    notStarted = course.unitsNotStarted ?? 0
    completed = course.unitsFullyCompleted ?? 0
  }

  const innerParts: NestedChartMetrics["innerParts"] = []
  if (wip > 0) {
    innerParts.push({ key: "wip", value: wip, color: CHART_COLORS.wip })
  }
  if (notStarted > 0) {
    innerParts.push({ key: "notStarted", value: notStarted, color: CHART_COLORS.notStarted })
  }
  if (completed > 0) {
    innerParts.push({ key: "completed", value: completed, color: CHART_COLORS.completed })
  }

  if (innerParts.length === 0) {
    innerParts.push({ key: "empty", value: 1, color: INNER_PLACEHOLDER_FILL })
  }

  return {
    showOuter,
    durationPercent: Math.min(Math.max(durationPercent, 0), 100),
    daysLeft,
    hasValidEnd,
    innerParts,
  }
}

// Convert incoming data to progress format
const convertToProgressData = (data: Course | null | undefined) => {
  if (!data)
    return {
      completion: 0,
      completedUnits: 0,
      totalUnits: 0,
      isGateway: false,
    }

  try {
    const coreType = data?.course?.course_core_type
    const isGateway = coreType === "Gateway"
    const courseWithQuestions = data as {
      course?: { questions?: Array<{ achieved?: boolean }> }
      questions?: Array<{ achieved?: boolean }>
    }
    const questions = Array.isArray(courseWithQuestions?.course?.questions)
      ? courseWithQuestions.course.questions
      : Array.isArray(courseWithQuestions?.questions)
        ? courseWithQuestions.questions
        : []

    if (isGateway && questions.length > 0) {
      const totalUnits = questions.length
      const fullyCompleted = questions.filter((q: { achieved?: boolean }) => q?.achieved === true).length
      const completion = totalUnits > 0 ? (fullyCompleted / totalUnits) * 100 : 0

      return {
        completion: Math.min(Math.max(completion, 0), 100),
        completedUnits: fullyCompleted,
        totalUnits,
        isGateway: true,
      }
    }
  } catch {}

  const totalUnits = data.totalUnits || 0
  const completedUnits = data.unitsFullyCompleted || 0
  const completion = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0

  return {
    completion: Math.min(Math.max(completion, 0), 100),
    completedUnits,
    totalUnits,
    isGateway: false,
  }
}

type ChartLabelKeys = {
  timeElapsed: string
  timeRemaining: string
  workInProgress: string
  notYetStarted: string
  completed: string
  noEndDate: string
  daysLeft: string
  noUnitData: string
  duration: string
}

function innerKeyToLabel(key: InnerSegmentKey, labels: ChartLabelKeys): string {
  switch (key) {
    case "wip":
      return labels.workInProgress
    case "notStarted":
      return labels.notYetStarted
    case "completed":
      return labels.completed
    default:
      return labels.noUnitData
  }
}

function CourseProgressNestedDonut({
  metrics,
  labels,
}: {
  metrics: NestedChartMetrics
  labels: ChartLabelKeys
}) {
  const elapsed = metrics.durationPercent
  const remaining = Math.max(0, 100 - elapsed)

  const outerData = metrics.showOuter
    ? [
        {
          name: labels.timeElapsed,
          value: elapsed,
          color: CHART_COLORS.duration,
          valueType: "percent" as const,
        },
        {
          name: labels.timeRemaining,
          value: remaining,
          color: DURATION_REMAINING_FILL,
          valueType: "percent" as const,
        },
      ]
    : []

  const innerData = metrics.innerParts.map((p) => ({
    name: innerKeyToLabel(p.key, labels),
    value: p.value,
    color: p.color,
    valueType: "count" as const,
  }))

  const outerInnerR = metrics.showOuter ? 58 : 48
  const outerOuterR = metrics.showOuter ? 72 : 72
  const innerInnerR = metrics.showOuter ? 38 : 44
  const innerOuterR = metrics.showOuter ? 54 : 68

  const centerPrimary =
    metrics.hasValidEnd && metrics.daysLeft !== null ? String(metrics.daysLeft) : "—"
  const centerSecondary = metrics.hasValidEnd ? labels.daysLeft : labels.noEndDate

  return (
    <div className="space-y-2">
      <div className="relative flex h-40 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {metrics.showOuter && (
              <Pie
                data={outerData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={outerInnerR}
                outerRadius={outerOuterR}
                stroke={CHART_COLORS.duration}
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
                cornerRadius={4}
                isAnimationActive={false}
              >
                {outerData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            )}
            <Pie
              data={innerData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerInnerR}
              outerRadius={innerOuterR}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              cornerRadius={3}
              isAnimationActive={false}
            >
              {innerData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value, name, item) => {
                const vt = (item as { payload?: { valueType?: string } } | undefined)?.payload?.valueType
                if (vt === "percent") {
                  return [`${Number(value).toFixed(0)}%`, name]
                }
                return [value, name]
              }}
              contentStyle={{
                borderRadius: 8,
                borderColor: "hsl(var(--border))",
                backgroundColor: "hsl(var(--background))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-semibold text-foreground tabular-nums">{centerPrimary}</span>
          <span className="max-w-22 text-xs font-medium leading-tight text-muted-foreground">
            {centerSecondary}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {metrics.showOuter && (
          <span className="inline-flex items-center gap-1">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.duration }} />
            {labels.duration}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.wip }} />
          {labels.workInProgress}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.notStarted }} />
          {labels.notYetStarted}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS.completed }} />
          {labels.completed}
        </span>
      </div>
    </div>
  )
}

export function CourseProgressCharts({ courses }: CourseProgressChartsProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const t = useTranslations("learnerDashboard.courseProgressCharts")

  const visibleCourses = useMemo(
    () => (courses ?? []).filter((c) => !isEnrollmentExcluded(c)),
    [courses]
  )

  if (!visibleCourses.length) {
    return null
  }

  const chartLabels: ChartLabelKeys = {
    timeElapsed: t("timeElapsed"),
    timeRemaining: t("timeRemaining"),
    workInProgress: t("workInProgress"),
    notYetStarted: t("notYetStarted"),
    completed: t("completed"),
    noEndDate: t("noEndDate"),
    daysLeft: t("daysLeft"),
    noUnitData: t("noUnitData"),
    duration: t("duration"),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-primary">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold">{t("progressOverview")}</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-1 ">
        {visibleCourses.map((course, index) => {
          const progressData = convertToProgressData(course)
          const metrics = getNestedChartMetrics(course)
          const courseName = course?.course?.course_name || t("courseFallback", { index: index + 1 })
          const colorIdx = index % cardBgColors.length
          const rowKey = course.user_course_id ?? course.course?.course_id ?? index

          return (
            <Card
              key={rowKey}
              className={cn(
                "relative shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              )}
              onClick={() => {
                const courseId = course.course?.course_id
                if (courseId) {
                  dispatch(setCurrentCourseId(courseId))
                  router.push(`/course-details/${courseId}`)
                }
              }}
            >
              <Badge
                variant={progressData.isGateway ? "default" : "outline"}
                className="absolute top-3 right-3 gap-1 rounded-full shadow-sm text-xs"
              >
                <Flag className="size-3" />
                {progressData.isGateway ? t("gateway") : t("core")}
              </Badge>
              <CardHeader className="space-y-1 pr-24">
                <CardTitle className="text-base font-semibold text-foreground line-clamp-2" title={courseName}>
                  {courseName}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>{t("nextMilestoneReview")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CourseProgressNestedDonut metrics={metrics} labels={chartLabels} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("progressLabel")}</span>
                    <span className="font-semibold text-foreground">{progressData.completion.toFixed(0)}%</span>
                  </div>
                  <Progress value={progressData.completion} className="h-2" />
                </div>
                <div
                  className={cn(
                    "grid grid-cols-2 gap-2 rounded-lg border border-dashed p-3 text-sm",
                    statsBgColors[colorIdx]
                  )}
                >
                  <div>
                    <p className="text-muted-foreground">{t("completedUnits")}</p>
                    <p className="font-semibold text-foreground">
                      {progressData.completedUnits}/{progressData.totalUnits}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("totalUnits")}</p>
                    <p className="font-semibold text-foreground">{progressData.totalUnits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
