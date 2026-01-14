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
}

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

  const formatAnswer = (question: Question, answer: string | string[] | null) => {
    if (answer === null || answer === undefined) {
      return <span className="text-muted-foreground italic">No answer provided</span>
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
          <Card>
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
                <Card key={question.id}>
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

