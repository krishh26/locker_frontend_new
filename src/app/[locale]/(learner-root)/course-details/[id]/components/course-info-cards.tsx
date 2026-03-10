"use client"

import {
  GraduationCap,
  FileText,
  Clock,
  Info,
  Tag,
  BarChart3,
  Building2,
  Calendar,
  Star,
  FileCheck,
  CheckCircle,
  BarChart,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { CourseInfo, UserCourseData } from "../data/course-details-data"

interface CourseInfoCardsProps {
  course: CourseInfo
  courseData: UserCourseData
}

function formatDate(dateString?: string, notAvailableLabel?: string) {
  if (!dateString) return notAvailableLabel ?? "N/A"
  try {
    return format(new Date(dateString), "d MMMM yyyy")
  } catch {
    return dateString
  }
}

export function CourseInfoCards({ course, courseData }: CourseInfoCardsProps) {
  const t = useTranslations("courseDetails.courseInfo")
  const na = t("notAvailable")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">{t("title")}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Card 1 - Course Details */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <GraduationCap className="h-5 w-5" />
              {course.course_name || t("courseNameFallback")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t("courseCode")}</span>
              <span className="font-semibold text-primary">
                {course.course_code || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t("level")}</span>
              <span className="font-semibold text-primary">
                {course.level || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{t("sector")}</span>
              <span className="font-semibold text-primary">
                {course.sector || na}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Qualification Details */}
        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-secondary">
              <FileText className="h-5 w-5" />
              {t("qualificationDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("qualificationType")}</span>
              <span className="font-semibold text-secondary">
                {course.qualification_type || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("minAge")}</span>
              <span className="font-semibold text-secondary">
                {course.recommended_minimum_age || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("totalCredits")}</span>
              <span className="font-semibold text-secondary">
                {course.total_credits || na}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Key Dates */}
        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-secondary">
              <Clock className="h-5 w-5" />
              {t("keyDatesHours")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("startDate")}</span>
              <span className="font-semibold text-secondary">
                {formatDate(courseData.start_date, na)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("endDate")}</span>
              <span className="font-semibold text-secondary">
                {formatDate(courseData.end_date, na)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">{t("learningHours")}</span>
              <span className="font-semibold text-secondary">
                {course.guided_learning_hours || na}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Additional Information */}
        <Card className="border-l-4 border-l-sky-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-sky-600">
              <Info className="h-5 w-5" />
              {t("additionalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">{t("brandGuidelines")}</span>
              <span className="font-semibold text-sky-600">
                {course.brand_guidelines || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">{t("status")}</span>
              <span className="font-semibold text-sky-600">
                {courseData.course_status || na}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">{t("gradingType")}</span>
              <span className="font-semibold text-sky-600">
                {course.overall_grading_type || na}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

