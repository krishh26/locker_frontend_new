"use client"

import { useRouter } from "@/i18n/navigation"
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

interface Course {
  user_course_id?: number
  course?: {
    course_id?: number
    course_name: string
    course_core_type?: string
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
  "bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-300/60 dark:border-violet-800/30",
  "bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/60 dark:border-emerald-800/30",
  "bg-linear-to-br from-sky-100 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/40 border-sky-300/60 dark:border-sky-800/30",
  "bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-950/50 dark:to-pink-950/40 border-rose-300/60 dark:border-rose-800/30",
  "bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/40 border-amber-300/60 dark:border-amber-800/30",
  "bg-linear-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/50 dark:to-teal-950/40 border-cyan-300/60 dark:border-cyan-800/30",
  "bg-linear-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-950/50 dark:to-pink-950/40 border-fuchsia-300/60 dark:border-fuchsia-800/30",
  "bg-linear-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/50 dark:to-blue-950/40 border-indigo-300/60 dark:border-indigo-800/30",
]

const donutColors = [
  { completed: "#8B5CF6", remaining: "rgba(139, 92, 246, 0.15)" }, // violet
  { completed: "#10B981", remaining: "rgba(16, 185, 129, 0.15)" }, // emerald
  { completed: "#0EA5E9", remaining: "rgba(14, 165, 233, 0.15)" }, // sky
  { completed: "#F43F5E", remaining: "rgba(244, 63, 94, 0.15)" },  // rose
  { completed: "#F59E0B", remaining: "rgba(245, 158, 11, 0.15)" }, // amber
  { completed: "#06B6D4", remaining: "rgba(6, 182, 212, 0.15)" },  // cyan
  { completed: "#D946EF", remaining: "rgba(217, 70, 239, 0.15)" }, // fuchsia
  { completed: "#6366F1", remaining: "rgba(99, 102, 241, 0.15)" }, // indigo
]

const statsBgColors = [
  "border-violet-200/60 bg-violet-50/50 dark:border-violet-800/30 dark:bg-violet-950/30",
  "border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/30",
  "border-sky-200/60 bg-sky-50/50 dark:border-sky-800/30 dark:bg-sky-950/30",
  "border-rose-200/60 bg-rose-50/50 dark:border-rose-800/30 dark:bg-rose-950/30",
  "border-amber-200/60 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/30",
  "border-cyan-200/60 bg-cyan-50/50 dark:border-cyan-800/30 dark:bg-cyan-950/30",
  "border-fuchsia-200/60 bg-fuchsia-50/50 dark:border-fuchsia-800/30 dark:bg-fuchsia-950/30",
  "border-indigo-200/60 bg-indigo-50/50 dark:border-indigo-800/30 dark:bg-indigo-950/30",
]

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
    const courseWithQuestions = data as { course?: { questions?: Array<{ achieved?: boolean }> }; questions?: Array<{ achieved?: boolean }> }
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

function CourseProgressDonut({
  completion,
  isGateway,
  colorIndex = 0,
}: {
  completion: number
  isGateway: boolean
  colorIndex?: number
}) {
  const safeCompletion = Math.min(Math.max(completion, 0), 100)
  const colors = donutColors[colorIndex % donutColors.length]
  const data = [
    { name: "Completed", value: safeCompletion, color: colors.completed },
    {
      name: "Remaining",
      value: Math.max(0, 100 - safeCompletion),
      color: colors.remaining,
    },
  ]

  return (
    <div className="relative flex h-40 w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={72}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            cornerRadius={8}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value, name) => [`${value}%`, name]}
            contentStyle={{
              borderRadius: 8,
              borderColor: "hsl(var(--border))",
              backgroundColor: "hsl(var(--background))",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-semibold text-foreground">
          {safeCompletion.toFixed(0)}%
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            isGateway ? "text-primary" : "text-muted-foreground"
          )}
        >
          {isGateway ? "Gateway prep" : "Course progress"}
        </span>
      </div>
    </div>
  )
}

export function CourseProgressCharts({ courses }: CourseProgressChartsProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  if (!courses || courses.length === 0) {
    return null
  }

  // Only show if there are multiple courses
  if (courses.length <= 1) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg p-1.5 bg-linear-to-br from-primary/20 to-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Progress Overview</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {courses.map((course, index) => {
          const progressData = convertToProgressData(course)
          const courseName = course?.course?.course_name || `Course ${index + 1}`
          const colorIdx = index % cardBgColors.length

          return (
            <Card
              key={index}
              className={cn(
                "shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]",
                cardBgColors[colorIdx]
              )}
              onClick={() => {
                const courseId = course.course?.course_id
                if (courseId) {
                  dispatch(setCurrentCourseId(courseId))
                  router.push(`/course-details/${courseId}`)
                }
              }}
            >
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold">{courseName}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>Next milestone: Review</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CourseProgressDonut
                  completion={progressData.completion}
                  isGateway={progressData.isGateway}
                  colorIndex={colorIdx}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {progressData.completion.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progressData.completion} className="h-2" />
                </div>
                <div className={cn(
                  "grid grid-cols-2 gap-2 rounded-lg border border-dashed p-3 text-sm",
                  statsBgColors[colorIdx]
                )}>
                  <div>
                    <p className="text-muted-foreground">Completed units</p>
                    <p className="font-semibold text-foreground">
                      {progressData.completedUnits}/{progressData.totalUnits}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total units</p>
                    <p className="font-semibold text-foreground">
                      {progressData.totalUnits}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={progressData.isGateway ? "default" : "outline"}
                    className="gap-1 rounded-full shadow-sm"
                  >
                    <Flag className="size-3.5" />
                    {progressData.isGateway
                      ? "Gateway preparation"
                      : "Core module"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

