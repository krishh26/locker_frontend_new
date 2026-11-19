"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

function getStaffLearnerId(pathname: string): string | null {
  const match = pathname.match(/^\/learner-dashboard\/(\d+)/)
  return match?.[1] ?? null
}

export function LearnerNavTabs() {
  const t = useTranslations("learnerDashboard.navTabs")
  const pathname = usePathname()
  const staffLearnerId = getStaffLearnerId(pathname)

  const dashboardHref = staffLearnerId
    ? `/learner-dashboard/${staffLearnerId}`
    : "/dashboard"
  const coursesHref = staffLearnerId
    ? `/learner-dashboard/${staffLearnerId}/courses`
    : "/courses"

  const isCoursesActive = staffLearnerId
    ? pathname.startsWith(`/learner-dashboard/${staffLearnerId}/courses`)
    : pathname === "/courses" || pathname.startsWith("/courses/")

  const isDashboardActive = !isCoursesActive

  const tabClass = (active: boolean) =>
    cn(
      "relative -mb-px pb-3 text-sm transition-colors",
      active
        ? "font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
        : "font-medium text-muted-foreground hover:text-foreground"
    )

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="border-b border-border"
    >
      <div className="flex items-center gap-6">
        <Link
          href={dashboardHref}
          className={tabClass(isDashboardActive)}
          aria-current={isDashboardActive ? "page" : undefined}
        >
          {t("dashboard")}
        </Link>
        <Link
          href={coursesHref}
          className={tabClass(isCoursesActive)}
          aria-current={isCoursesActive ? "page" : undefined}
        >
          {t("courses")}
        </Link>
      </div>
    </nav>
  )
}
