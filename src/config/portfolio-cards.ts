import type { MetricCard } from "@/components/dashboard/metric-cards"

// Re-export MetricCard as PortfolioCard for convenience
export type PortfolioCard = MetricCard

/**
 * All portfolio cards used across the application
 */
export const portfolioCards: PortfolioCard[] = [
  { id: 1, name: "Evidence Library", color: "#FCA14E", route: "/evidence-library" },
  { id: 2, name: "Unit Progress", color: "#8F78F4", route: "/module-unit-progress" },
  { id: 3, name: "Gap Analysis", color: "#F44771", route: "/gap-analysis" },
  { id: 4, name: "Actions and Activities", color: "#009FB7", route: "/resources" },
  { id: 5, name: "Health and Wellbeing", color: "#E95ACB", route: "/health-wellbeing" },
  { id: 6, name: "Choose Units", color: "#489E20", route: "/choose-units" },
  { id: 7, name: "Learning Plan", color: "#1E72AE", route: "/learning-plan" },
  { id: 8, name: "Resources", color: "#A847F4", route: "/course-resources" },
  { id: 9, name: "Time Log", color: "#B7B000", route: "/time-log" },
  { id: 10, name: "Supplementary Training", color: "#4564D0", route: "/supplementary-training" },
  { id: 11, name: "New Doc to Sign", color: "#007E84", route: "/learners-documents-to-sign" },
]

/**
 * Overview cards shown on the main /portfolio page
 * IDs: 4 (Actions), 5 (Health), 9 (Time Log), 10 (Training), 11 (Docs)
 */
export const overviewCards = portfolioCards.filter((card) =>
  [4, 5, 9, 10, 11].includes(card.id)
)

/**
 * Course-specific cards shown on course details page
 * IDs: 1 (Evidence), 2 (Unit Progress), 3 (Gap), 6 (Choose Units), 7 (Learning Plan), 8 (Resources)
 */
export const courseCards = portfolioCards.filter((card) =>
  [1, 2, 3, 6, 7, 8].includes(card.id)
)

/**
 * Gateway course cards (subset of course cards)
 * IDs: 7 (Learning Plan), 8 (Resources)
 */
export const gatewayCards = portfolioCards.filter((card) =>
  [7, 8].includes(card.id)
)

