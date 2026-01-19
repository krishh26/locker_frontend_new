"use client"

import { MetricCards, type MetricCard } from "@/components/dashboard/metric-cards"

interface CourseMetricCardsProps {
  cards: MetricCard[]
  courseId: string
}

export function CourseMetricCards({ cards, courseId }: CourseMetricCardsProps) {
  return <MetricCards cards={cards} courseId={courseId} variant="compact" />
}

// Re-export MetricCard type for convenience
export type { MetricCard as PortfolioCard } from "@/components/dashboard/metric-cards"
