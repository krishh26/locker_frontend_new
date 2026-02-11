"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, Calendar } from "lucide-react"
import { type Response } from "@/store/api/survey/surveyApi"
import { calculateAverageTime, calculateDuration } from "../utils/response-aggregation"

interface ResponseStatisticsProps {
  responses: Response[]
}

const statCards = [
  {
    bg: "bg-linear-to-br from-violet-100 to-purple-100 dark:from-violet-950/50 dark:to-purple-950/40 border-violet-300/60 dark:border-violet-800/30",
    iconBg: "bg-violet-200/70 dark:bg-violet-800/40",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    bg: "bg-linear-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/40 border-amber-300/60 dark:border-amber-800/30",
    iconBg: "bg-amber-200/70 dark:bg-amber-800/40",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    bg: "bg-linear-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/40 border-emerald-300/60 dark:border-emerald-800/30",
    iconBg: "bg-emerald-200/70 dark:bg-emerald-800/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
]

export function ResponseStatistics({ responses }: ResponseStatisticsProps) {
  const totalResponses = responses.length
  const averageTime = calculateAverageTime(responses)
  const durationDays = calculateDuration(responses)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className={statCards[0].bg}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Responses</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[0].iconBg}`}>
            <Users className={`h-4 w-4 ${statCards[0].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResponses}</div>
        </CardContent>
      </Card>

      <Card className={statCards[1].bg}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Time</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[1].iconBg}`}>
            <Clock className={`h-4 w-4 ${statCards[1].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageTime}</div>
        </CardContent>
      </Card>

      <Card className={statCards[2].bg}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Duration</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[2].iconBg}`}>
            <Calendar className={`h-4 w-4 ${statCards[2].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{durationDays} Day{durationDays !== 1 ? "s" : ""}</div>
        </CardContent>
      </Card>
    </div>
  )
}

