"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface MetricCard {
  id: number
  name: string
  color: string
  route?: string
}

export interface MetricCardsProps {
  cards: MetricCard[]
  /** Optional count data for cards that need to display counts */
  countData?: Record<number, number | undefined>
  /** Optional course ID to append to routes */
  courseId?: string
  /** Grid layout variant */
  variant?: "default" | "compact"
}

export function MetricCards({
  cards,
  countData = {},
  courseId,
  variant = "default",
}: MetricCardsProps) {
  const gridClasses =
    variant === "compact"
      ? "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      : "grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"

  const iconSize = variant === "compact" ? "w-12 h-12" : "w-16 h-16"
  const textSize = variant === "compact" ? "text-lg" : "text-2xl"

  return (
    <div className={gridClasses}>
      {cards.map((card) => {
        // Build route with optional courseId
        let route = card.route || "#"
        if (courseId && card.route) {
          route = `${card.route}?course_id=${courseId}`
        }

        // Get count for this card if available
        const count = countData?.[card.id]
        const hasCount = count !== undefined && count > 0

        return (
          <Link key={card.id} href={route} className="group">
            <Card className="h-full border border-border/60 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`${iconSize} rounded-lg flex items-center justify-center transition-transform group-hover:scale-110`}
                    style={{ backgroundColor: card.color }}
                  >
                    <span className={`${textSize} font-bold text-white`}>
                      {card.name.charAt(0)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {card.name}
                    </h3>
                    {hasCount && (
                      <Badge variant="secondary" className="rounded-full">
                        {count} {count === 1 ? "item" : "items"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

