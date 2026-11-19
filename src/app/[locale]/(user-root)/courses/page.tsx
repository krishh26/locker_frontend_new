"use client"

import type { ReactNode } from "react"
import { useRouter } from "@/i18n/navigation"
import { useEffect } from "react"
import { useAppSelector } from "@/store/hooks"
import { DashboardUserSync } from "../dashboard/components/dashboard-user-sync"
import { LearnerCoursesPage } from "../dashboard/components/learner-section/learner-courses-page"

export default function CoursesPage() {
  const router = useRouter()
  const userRole = useAppSelector((state) => state.auth.user?.role)

  useEffect(() => {
    if (userRole && userRole !== "Learner") {
      router.replace("/dashboard")
    }
  }, [userRole, router])

  let content: ReactNode = null
  if (userRole === "Learner") {
    content = <LearnerCoursesPage />
  }

  return (
    <>
      <DashboardUserSync />
      {content}
    </>
  )
}
