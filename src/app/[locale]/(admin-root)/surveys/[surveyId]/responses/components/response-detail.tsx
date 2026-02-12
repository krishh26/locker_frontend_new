"use client"

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  useGetSurveyByIdQuery,
  useGetQuestionsQuery,
  type Response,
  type Question,
} from "@/store/api/survey/surveyApi"

interface ResponseDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  response: Response | null
}

const questionTypeLabels: Record<Question["type"], string> = {
  "short-text": "Short Text",
  "long-text": "Long Text",
  "multiple-choice": "Multiple Choice",
  checkbox: "Checkbox",
  rating: "Rating",
  date: "Date",
  likert: "Likert Scale",
}

const questionDetailColors = [
  "bg-linear-to-br from-sky-50/50 to-blue-50/50 dark:from-sky-950/20 dark:to-blue-950/15 border-sky-200/50 dark:border-sky-800/30",
  "bg-linear-to-br from-rose-50/50 to-pink-50/50 dark:from-rose-950/20 dark:to-pink-950/15 border-rose-200/50 dark:border-rose-800/30",
  "bg-linear-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/15 border-emerald-200/50 dark:border-emerald-800/30",
  "bg-linear-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/15 border-violet-200/50 dark:border-violet-800/30",
  "bg-linear-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/15 border-amber-200/50 dark:border-amber-800/30",
  "bg-linear-to-br from-cyan-50/50 to-teal-50/50 dark:from-cyan-950/20 dark:to-teal-950/15 border-cyan-200/50 dark:border-cyan-800/30",
]

export function ResponseDetail({
  open,
  onOpenChange,
  surveyId,
  response,
}: ResponseDetailProps) {
  // Fetch survey from API
  const { data: surveyResponse } = useGetSurveyByIdQuery(surveyId)
  const survey = surveyResponse?.data?.survey
  
  // Fetch questions from API
  const { data: questionsResponse } = useGetQuestionsQuery(surveyId, {
    skip: !surveyId,
    refetchOnMountOrArgChange: true,
  })
  const questions = questionsResponse?.data?.questions || []

  if (!response || !survey) {
    return null
  }

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  const formatAnswer = (question: Question, answer: string | string[] | Record<string, string> | null) => {
    if (answer === null || answer === undefined) {
      return <span className="text-muted-foreground italic">No answer provided</span>
    }

    if (question.type === "likert" && typeof answer === "object" && !Array.isArray(answer)) {
      // Likert responses are stored as objects: { "0": "option1", "1": "option2" }
      if (question.statements && question.statements.length > 0) {
        return (
          <div className="space-y-2">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 p-2 text-left font-medium">
                    Statement
                  </th>
                  <th className="border border-border bg-muted/50 p-2 text-left font-medium">
                    Selected Option
                  </th>
                </tr>
              </thead>
              <tbody>
                {question.statements.map((statement, index) => {
                  const statementKey = String(index)
                  const selectedOption = answer[statementKey] || "Not answered"
                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="border border-border p-2 font-medium">
                        {statement}
                      </td>
                      <td className="border border-border p-2">
                        <Badge variant="secondary">{selectedOption}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      }
      // Fallback if statements are not available
      return (
        <div className="space-y-1">
          {Object.entries(answer).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-medium">Statement {Number(key) + 1}:</span>
              <Badge variant="secondary">{value}</Badge>
            </div>
          ))}
        </div>
      )
    }

    if (question.type === "checkbox" && Array.isArray(answer)) {
      return (
        <div className="space-y-1">
          {answer.map((item, index) => (
            <Badge key={index} variant="secondary" className="mr-2">
              {item}
            </Badge>
          ))}
        </div>
      )
    }

    if (question.type === "date" && typeof answer === "string") {
      try {
        return format(new Date(answer), "PPP")
      } catch {
        return answer
      }
    }

    if (Array.isArray(answer)) {
      return answer.join(", ")
    }

    return <span>{String(answer)}</span>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Response Details</DialogTitle>
          <DialogDescription>
            Submitted on {format(new Date(response.submittedAt), "PPP 'at' p")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/15">
            <CardHeader>
              <CardTitle className="text-lg">{survey.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {survey.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {survey.description}
                </p>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div className="space-y-4">
            {sortedQuestions.map((question, index) => {
              const answer = response.answers[question.id]
              return (
                <Card key={question.id} className={questionDetailColors[index % questionDetailColors.length]}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {index + 1}. {question.title}
                        </CardTitle>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {questionTypeLabels[question.type]}
                        </Badge>
                        {question.required && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Answer:
                      </p>
                      <div className="text-base">
                        {formatAnswer(question, answer)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

