"use client"

import { BookOpen } from "lucide-react"
import { useTranslations } from "next-intl"
import { PageHeader } from "@/components/dashboard/page-header"
import { useAppSelector } from "@/store/hooks"
import { selectLearner } from "@/store/slices/authSlice"
import type { LearnerCourse } from "@/store/api/learner/types"
import { CourseProgressCharts } from "./course-progress-charts"
import { LearnerNavTabs } from "./learner-nav-tabs"

export function LearnerCoursesPage() {
  const t = useTranslations("learnerDashboard")
  const learner = useAppSelector(selectLearner)
  const courses = (learner?.course ?? []) as LearnerCourse[]

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <PageHeader
        title={t("coursesPage.title")}
        subtitle={t("coursesPage.subtitle")}
        icon={BookOpen}
      />

      <LearnerNavTabs />

      {courses.length > 0 ? (
        <CourseProgressCharts courses={courses} />
      ) : (
        <div className="rounded-xl border bg-muted/20 px-6 py-12 text-center">
          <p className="font-medium text-foreground">
            {t("coursesPage.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("coursesPage.emptyDescription")}
          </p>
        </div>
      )}
    </div>
  )
}
