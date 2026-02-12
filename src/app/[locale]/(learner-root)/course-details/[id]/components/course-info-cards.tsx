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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { CourseInfo, UserCourseData } from "../data/course-details-data"

interface CourseInfoCardsProps {
  course: CourseInfo
  courseData: UserCourseData
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A"
  try {
    return format(new Date(dateString), "d MMMM yyyy")
  } catch {
    return dateString
  }
}

export function CourseInfoCards({ course, courseData }: CourseInfoCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Course Information</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Card 1 - Course Details */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <GraduationCap className="h-5 w-5" />
              {course.course_name || "Course Name"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Course Code:</span>
              <span className="font-semibold text-primary">
                {course.course_code || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Level:</span>
              <span className="font-semibold text-primary">
                {course.level || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Sector:</span>
              <span className="font-semibold text-primary">
                {course.sector || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Qualification Details */}
        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-secondary">
              <FileText className="h-5 w-5" />
              Qualification Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileCheck className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">Qualification Type:</span>
              <span className="font-semibold text-secondary">
                {course.qualification_type || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">Min. Age:</span>
              <span className="font-semibold text-secondary">
                {course.recommended_minimum_age || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">Total Credits:</span>
              <span className="font-semibold text-secondary">
                {course.total_credits || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Key Dates */}
        <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-secondary">
              <Clock className="h-5 w-5" />
              Key Dates & Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-semibold text-secondary">
                {formatDate(courseData.start_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-semibold text-secondary">
                {formatDate(courseData.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-secondary" />
              <span className="text-muted-foreground">Learning Hours:</span>
              <span className="font-semibold text-secondary">
                {course.guided_learning_hours || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Additional Information */}
        <Card className="border-l-4 border-l-sky-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-sky-600">
              <Info className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">Brand Guidelines:</span>
              <span className="font-semibold text-sky-600">
                {course.brand_guidelines || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">Status:</span>
              <span className="font-semibold text-sky-600">
                {courseData.course_status || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BarChart className="h-4 w-4 text-sky-500" />
              <span className="text-muted-foreground">Grading Type:</span>
              <span className="font-semibold text-sky-600">
                {course.overall_grading_type || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

