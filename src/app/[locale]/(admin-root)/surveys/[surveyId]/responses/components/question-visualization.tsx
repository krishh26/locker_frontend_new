"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { type Question, type Response } from "@/store/api/survey/surveyApi"
import {
  aggregateMultipleChoice,
  aggregateCheckbox,
  aggregateRating,
  aggregateLikert,
  aggregateDate,
  getTextResponses,
  type AggregatedOption,
} from "../utils/response-aggregation"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts"
import { format } from "date-fns"

interface QuestionVisualizationProps {
  question: Question
  responses: Response[]
  questionIndex: number
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
]

const questionCardColors = [
  "bg-linear-to-br from-sky-100/60 to-blue-100/60 dark:from-sky-950/30 dark:to-blue-950/20 border-sky-300/40 dark:border-sky-800/30",
  "bg-linear-to-br from-rose-100/60 to-pink-100/60 dark:from-rose-950/30 dark:to-pink-950/20 border-rose-300/40 dark:border-rose-800/30",
  "bg-linear-to-br from-emerald-100/60 to-teal-100/60 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-300/40 dark:border-emerald-800/30",
  "bg-linear-to-br from-violet-100/60 to-purple-100/60 dark:from-violet-950/30 dark:to-purple-950/20 border-violet-300/40 dark:border-violet-800/30",
  "bg-linear-to-br from-amber-100/60 to-orange-100/60 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-300/40 dark:border-amber-800/30",
  "bg-linear-to-br from-cyan-100/60 to-teal-100/60 dark:from-cyan-950/30 dark:to-teal-950/20 border-cyan-300/40 dark:border-cyan-800/30",
  "bg-linear-to-br from-fuchsia-100/60 to-pink-100/60 dark:from-fuchsia-950/30 dark:to-pink-950/20 border-fuchsia-300/40 dark:border-fuchsia-800/30",
  "bg-linear-to-br from-indigo-100/60 to-blue-100/60 dark:from-indigo-950/30 dark:to-blue-950/20 border-indigo-300/40 dark:border-indigo-800/30",
]

export function QuestionVisualization({
  question,
  responses,
  questionIndex,
}: QuestionVisualizationProps) {
  const renderVisualization = () => {
    switch (question.type) {
      case "multiple-choice":
        return renderMultipleChoice()
      case "checkbox":
        return renderCheckbox()
      case "rating":
        return renderRating()
      case "likert":
        return renderLikert()
      case "date":
        return renderDate()
      case "short-text":
      case "long-text":
        return renderText()
      default:
        return <p className="text-muted-foreground">Visualization not available for this question type.</p>
    }
  }

  const renderMultipleChoice = () => {
    const data = aggregateMultipleChoice(question, responses)
    // Filter out 0% segments to avoid clutter
    const filteredData = data.filter((item) => item.count > 0)
    const total = data.reduce((sum, item) => sum + item.count, 0)

    if (total === 0) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="count"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload as AggregatedOption
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-medium">{data.option}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            formatter={(value) => {
              const item = filteredData.find((d) => d.option === value)
              return item ? `${value}: ${item.percentage.toFixed(1)}%` : value
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderCheckbox = () => {
    const data = aggregateCheckbox(question, responses)
    const total = data.reduce((sum, item) => sum + item.count, 0)

    if (total === 0) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="option" type="category" width={150} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload as AggregatedOption
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-medium">{data.option}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" fill="#0088FE">
            <LabelList dataKey="count" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderRating = () => {
    const { distribution, average, total } = aggregateRating(question, responses)
    // Filter out 0% ratings to avoid clutter
    const filteredDistribution = distribution.filter((item) => item.count > 0)

    if (total === 0) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{average.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={filteredDistribution}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="count"
            >
              {filteredDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1] || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const data = payload[0].payload as { rating: number; count: number; percentage: number }
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">Rating {data.rating}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.count} ({data.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              formatter={(value) => {
                const item = filteredDistribution.find((d) => String(d.rating) === value)
                return item ? `Rating ${value}: ${item.percentage.toFixed(1)}%` : `Rating ${value}`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderLikert = () => {
    const { statements } = aggregateLikert(question, responses)

    if (statements.length === 0 || !question.options) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <div className="space-y-6">
        {statements.map((stmtData, stmtIndex) => {
          const total = stmtData.options.reduce((sum, item) => sum + item.count, 0)
          if (total === 0) return null

          return (
            <div key={stmtIndex} className="space-y-2">
              <h4 className="font-medium text-sm">{stmtData.statement}</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={stmtData.options.map((opt) => ({
                    ...opt,
                    name: opt.option,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length > 0) {
                        const data = payload[0].payload as AggregatedOption
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="font-medium">{data.option}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.count} ({data.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="percentage" fill="#0088FE">
                    <LabelList
                      dataKey="percentage"
                      position="right"
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDate = () => {
    const data = aggregateDate(question, responses)
    const total = data.reduce((sum, item) => sum + item.count, 0)

    if (total === 0) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="option" />
          <YAxis />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload as AggregatedOption
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-medium">{data.option}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Bar dataKey="count" fill="#0088FE">
            <LabelList dataKey="count" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderText = () => {
    const textResponses = getTextResponses(question, responses)

    if (textResponses.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No responses yet</p>
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{textResponses.length}</div>
          <div className="text-sm text-muted-foreground">Total Responses</div>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <h4 className="font-medium text-sm">Latest Responses:</h4>
          {textResponses.slice(0, 10).map((response, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg bg-muted/30 text-sm"
            >
              <div className="mb-1">{response.text}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(response.submittedAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          ))}
          {textResponses.length > 10 && (
            <p className="text-xs text-muted-foreground text-center">
              Showing 10 of {textResponses.length} responses
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={questionCardColors[questionIndex % questionCardColors.length]}>
      <CardHeader>
        <CardTitle className="text-base">
          {questionIndex + 1}. {question.title}
        </CardTitle>
        {question.description && (
          <CardDescription>{question.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{renderVisualization()}</CardContent>
    </Card>
  )
}

