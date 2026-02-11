"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

const metricCardBgColors = [
  "bg-linear-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/40 border-orange-300/60 dark:border-orange-800/30",
  "bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-300/60 dark:border-violet-800/30",
  "bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-950/50 dark:to-pink-950/40 border-rose-300/60 dark:border-rose-800/30",
  "bg-linear-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/50 dark:to-teal-950/40 border-cyan-300/60 dark:border-cyan-800/30",
  "bg-linear-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-950/50 dark:to-pink-950/40 border-fuchsia-300/60 dark:border-fuchsia-800/30",
  "bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/60 dark:border-emerald-800/30",
  "bg-linear-to-br from-sky-100 to-blue-100 dark:from-sky-950/50 dark:to-blue-950/40 border-sky-300/60 dark:border-sky-800/30",
  "bg-linear-to-br from-indigo-100 to-blue-100 dark:from-indigo-950/50 dark:to-blue-950/40 border-indigo-300/60 dark:border-indigo-800/30",
  "bg-linear-to-br from-lime-100 to-green-100 dark:from-lime-950/50 dark:to-green-950/40 border-lime-300/60 dark:border-lime-800/30",
  "bg-linear-to-br from-amber-100 to-yellow-100 dark:from-amber-950/50 dark:to-yellow-950/40 border-amber-300/60 dark:border-amber-800/30",
  "bg-linear-to-br from-teal-100 to-emerald-100 dark:from-teal-950/50 dark:to-emerald-950/40 border-teal-300/60 dark:border-teal-800/30",
]

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
      {cards.map((card, index) => {
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
            <Card className={cn(
              "h-full shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
              metricCardBgColors[index % metricCardBgColors.length]
            )}>
              <CardContent>
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div
                    className={`${iconSize} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-md`}
                    style={{ backgroundColor: card.color }}
                  >
                    <span className={`${textSize} font-bold text-white drop-shadow-sm`}>
                      {card.name.charAt(0)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {card.name}
                    </h3>
                    {hasCount && (
                      <Badge variant="secondary" className="rounded-full shadow-sm">
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

