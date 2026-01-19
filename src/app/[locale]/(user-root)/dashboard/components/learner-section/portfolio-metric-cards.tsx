"use client"

import { MetricCards, type MetricCard } from "@/components/dashboard/metric-cards"

interface PortfolioMetricCardsProps {
  cards: MetricCard[]
  countData: {
    newDocTotal?: number
  }
}

export function PortfolioMetricCards({ cards, countData }: PortfolioMetricCardsProps) {
  // Convert countData to the format expected by MetricCards
  const cardCountData: Record<number, number | undefined> = {
    11: countData.newDocTotal, // "New Doc to Sign" card
  }

  return <MetricCards cards={cards} countData={cardCountData} variant="default" />
}

// Re-export MetricCard type for convenience
export type { MetricCard as PortfolioCard } from "@/components/dashboard/metric-cards"
