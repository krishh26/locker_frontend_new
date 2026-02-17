"use client"

import { useMemo } from "react"
import { Loader2 } from "lucide-react"
import {
  useGetSurveyByIdQuery,
  useGetQuestionsQuery,
  useGetResponsesQuery,
} from "@/store/api/survey/surveyApi"
import { ResponseStatistics } from "./response-statistics"
import { QuestionVisualization } from "./question-visualization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ResponsesOverviewProps {
  surveyId: string
}

export function ResponsesOverview({ surveyId }: ResponsesOverviewProps) {
  // Fetch survey
  const { data: surveyResponse, isLoading: isLoadingSurvey } = useGetSurveyByIdQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const survey = surveyResponse?.data?.survey

  // Fetch questions
  const { data: questionsResponse, isLoading: isLoadingQuestions } = useGetQuestionsQuery(surveyId, {
    refetchOnMountOrArgChange: true,
    skip: !surveyId,
  })
  const questions = questionsResponse?.data?.questions || []

  // Fetch all responses (use high limit to get all)
  const { data: responsesResponse, isLoading: isLoadingResponses } = useGetResponsesQuery(
    {
      surveyId,
      params: { page: 1, limit: 1000 }, // High limit to get all responses
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !surveyId,
    }
  )
  const responses = responsesResponse?.data?.responses || []

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => a.order - b.order)
  }, [questions])

  const isLoading = isLoadingSurvey || isLoadingQuestions || isLoadingResponses

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading responses...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Survey not found</p>
        </CardContent>
      </Card>
    )
  }

  if (responses.length === 0) {
    return (
      <div className="space-y-6">
        <ResponseStatistics responses={responses} />
        <Card className="bg-muted border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary border-primary flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <CardTitle>No Responses Yet</CardTitle>
            <CardDescription>
              Share the survey link to start collecting responses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <ResponseStatistics responses={responses} />

      {/* Questions Visualizations */}
      <div className="space-y-6">
        {sortedQuestions.map((question, index) => (
          <QuestionVisualization
            key={question.id}
            question={question}
            responses={responses}
            questionIndex={index}
          />
        ))}
      </div>
    </div>
  )
}

