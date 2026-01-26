"use client"

import { useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
import { BookOpen, ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { CourseMetricCards } from "./course-metric-cards"
import { CourseInfoCards } from "./course-info-cards"
import { SupervisorCards } from "./supervisor-cards"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentCourseId } from "@/store/slices/courseSlice"
import {
  courseCards,
  gatewayCards,
  getUniqueUserData,
  type UserCourseData,
} from "../data/course-details-data"

interface CourseDetailsPageContentProps {
  courseId?: string
}

export function CourseDetailsPageContent({ courseId: routeCourseId }: CourseDetailsPageContentProps) {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const learner = useAppSelector((state) => state.auth.learner)
  const currentCourseId = useAppSelector(selectCurrentCourseId)
  const userRole = user?.role

  // Use course ID from Redux store, fallback to route param if available
  const courseId = currentCourseId ? String(currentCourseId) : routeCourseId

  // Find the course data from learner's courses
  const courseData = useMemo(() => {
    if (!learner?.course || !courseId) return null
    return learner.course.find(
      (c) => String(c.course?.course_id) === courseId
    ) as UserCourseData | undefined
  }, [learner?.course, courseId])

  const course = courseData?.course
  const isGateway = course?.course_core_type === "Gateway"
  const isQualification = course?.course_core_type === "Qualification"

  // Get appropriate cards based on course type
  const cards = useMemo(() => {
    if (isGateway) {
      return gatewayCards
    }
    
    // For non-Gateway courses, filter out "Choose Units" unless it's a Qualification course
    if (!isQualification) {
      return courseCards.filter((card) => card.id !== 6) // Filter out "Choose Units" (id: 6)
    }
    
    return courseCards
  }, [isGateway, isQualification])

  // Get unique supervisors
  const supervisors = useMemo(() => {
    if (!courseData) return []
    return getUniqueUserData(courseData)
  }, [courseData])

  const handleBack = () => {
    if (userRole === 'Learner' || userRole === 'Admin') {
      router.push("/dashboard")
    } else {
      router.push('/learner-overview')
    }
  }

  if (!courseData || !course || !courseId) {
    return (
      <>
        <div className="px-4 lg:px-6">
          <PageHeader
            title="Course information not found"
            icon={BookOpen}
            showBackButton
            backButtonHref={userRole === 'Learner' || userRole === 'Admin' ? '/dashboard' : '/learner-overview'}
          />
        </div>
        <div className="px-4 lg:px-6 py-12 text-center">
          <p className="text-muted-foreground">
            The requested course could not be found. Please go back and try again.
          </p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="px-4 lg:px-6">
        <PageHeader
          title={course.course_name}
          subtitle="Course information"
          icon={BookOpen}
          showBackButton
          backButtonHref={userRole === 'Learner' || userRole === 'Admin' ? '/dashboard' : '/learner-overview'}
        />
      </div>

      <div className="px-4 lg:px-6 space-y-6">
        {/* Portfolio Cards for this Course */}
        <CourseMetricCards cards={cards} courseId={courseId} />

        {/* Course Information Cards */}
        <CourseInfoCards course={course} courseData={courseData} />

        {/* Supervisors Section */}
        {supervisors.length > 0 && (
          <SupervisorCards supervisors={supervisors} />
        )}
      </div>
    </>
  )
}

