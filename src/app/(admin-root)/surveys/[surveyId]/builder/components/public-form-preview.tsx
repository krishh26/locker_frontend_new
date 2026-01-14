"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type Survey, type Question } from "@/store/slices/surveySlice"

interface PublicFormPreviewProps {
  surveyId: string
  survey: Survey
  questions: Question[]
}

export function PublicFormPreview({
  survey,
  questions,
}: PublicFormPreviewProps) {
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  const backgroundStyle = survey.background
    ? survey.background.type === "gradient"
      ? { background: survey.background.value }
      : { backgroundImage: `url(${survey.background.value})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {}

  return (
    <div
      className="min-h-screen p-4 py-8"
      style={backgroundStyle}
    >
      <div className="mx-auto max-w-2xl">
        <Card className="bg-background/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{survey.name}</CardTitle>
            {survey.description && (
              <CardDescription>{survey.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sortedQuestions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No questions yet. Add questions to see the preview.
                </p>
              ) : (
                sortedQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {index + 1}. {question.title}
                          {question.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </h3>
                        {question.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {question.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2">
                      {question.type === "short-text" && (
                        <div className="h-10 border rounded-md bg-muted/50 flex items-center px-3 text-muted-foreground">
                          Short text answer
                        </div>
                      )}
                      {question.type === "long-text" && (
                        <div className="h-24 border rounded-md bg-muted/50 flex items-center px-3 text-muted-foreground">
                          Long text answer
                        </div>
                      )}
                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option}
                              className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50"
                            >
                              <div className="h-4 w-4 rounded-full border-2 border-primary" />
                              <span className="text-sm text-muted-foreground">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === "checkbox" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option}
                              className="flex items-center space-x-2 p-2 border rounded-md bg-muted/50"
                            >
                              <div className="h-4 w-4 border-2 border-primary rounded" />
                              <span className="text-sm text-muted-foreground">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === "rating" && (
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <div
                              key={rating}
                              className="h-8 w-8 rounded-full border-2 border-primary flex items-center justify-center text-sm text-muted-foreground"
                            >
                              {rating}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.type === "date" && (
                        <div className="h-10 border rounded-md bg-muted/50 flex items-center px-3 text-muted-foreground">
                          Select date
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sortedQuestions.length > 0 && (
                <div className="pt-4">
                  <div className="h-10 bg-primary text-primary-foreground rounded-md flex items-center justify-center font-medium">
                    Submit
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

