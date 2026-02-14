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
    bg: "bg-secondary border-secondary",
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
  {
    bg: "bg-secondary border-secondary",
    iconBg: "bg-white/10",
    iconColor: "text-white",
  },
  {
    bg: "bg-accent border-accent",
    iconBg: "bg-white/10",
    iconColor: "text-white",
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
          <CardTitle className="text-sm font-medium text-white">Responses</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[0].iconBg}`}>
            <Users className={`h-4 w-4 ${statCards[0].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalResponses}</div>
        </CardContent>
      </Card>

      <Card className={statCards[1].bg}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Average Time</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[1].iconBg}`}>
            <Clock className={`h-4 w-4 ${statCards[1].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{averageTime}</div>
        </CardContent>
      </Card>

      <Card className={statCards[2].bg}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Duration</CardTitle>
          <div className={`rounded-lg p-2 ${statCards[2].iconBg}`}>
            <Calendar className={`h-4 w-4 ${statCards[2].iconColor}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{durationDays} Day{durationDays !== 1 ? "s" : ""}</div>
        </CardContent>
      </Card>
    </div>
  )
}

