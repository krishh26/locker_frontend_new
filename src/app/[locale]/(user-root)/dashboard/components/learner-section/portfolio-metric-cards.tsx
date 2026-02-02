"use client"

import { MetricCards, type MetricCard } from "@/components/dashboard/metric-cards"
import type { PortfolioCountData } from "@/store/api/dashboard/types"

interface PortfolioMetricCardsProps {
  cards: MetricCard[]
  countData: PortfolioCountData
}

export function PortfolioMetricCards({ cards, countData }: PortfolioMetricCardsProps) {
  // Map portfolio card IDs to countData fields (card IDs from config/portfolio-cards)
  const cardCountData: Record<number, number | undefined> = {
    1: countData.evidenceTotal, // Evidence Library
    2: countData.unitsTotal, // Unit Progress (or unitsCompleted)
    3: countData.gapsTotal, // Gap Analysis
    6: countData.selectedUnits, // Choose Units
    7: countData.sessionsTotal, // Learning Plan
    8: countData.resourcesTotal, // Resources
    11: countData.newDocTotal, // New Doc to Sign
  }

  return <MetricCards cards={cards} countData={cardCountData} variant="default" />
}

// Re-export MetricCard type for convenience
export type { MetricCard as PortfolioCard } from "@/components/dashboard/metric-cards"
