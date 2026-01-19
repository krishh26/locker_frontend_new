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
}: {
  completion: number
  isGateway: boolean
}) {
  const safeCompletion = Math.min(Math.max(completion, 0), 100)
  const data = [
    { name: "Completed", value: safeCompletion, color: "hsl(var(--primary))" },
    {
      name: "Remaining",
      value: Math.max(0, 100 - safeCompletion),
      color: "hsl(var(--muted-foreground) / 0.35)",
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
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Progress Overview</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {courses.map((course, index) => {
          const progressData = convertToProgressData(course)
          const courseName = course?.course?.course_name || `Course ${index + 1}`

          return (
            <Card
              key={index}
              className="border border-border/60 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                // Navigate to course details page with course ID
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
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-sm">
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
                    className="gap-1 rounded-full"
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

