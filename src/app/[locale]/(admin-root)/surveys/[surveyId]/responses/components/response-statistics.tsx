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
    bg: "bg-secondary/5 border-secondary/15",
    iconBg: "bg-secondary/15",
    iconColor: "text-secondary",
  },
  {
    bg: "bg-secondary/5 border-secondary/15",
    iconBg: "bg-secondary/15",
    iconColor: "text-secondary",
  },
  {
    bg: "bg-accent/5 border-accent/15",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
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

