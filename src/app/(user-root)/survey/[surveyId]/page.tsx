"use client"

import { use, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  useGetPublicSurveyQuery,
  useSubmitResponseMutation,
  type Question,
} from "@/store/api/survey/surveyApi"

interface PublicFormPageProps {
  params: Promise<{ surveyId: string }>
}

export default function PublicFormPage({ params }: PublicFormPageProps) {
  const { surveyId } = use(params)
  const [submitted, setSubmitted] = useState(false)
  
  const {
    data: surveyData,
    isLoading,
    isError,
    error,
  } = useGetPublicSurveyQuery(surveyId)

  const [submitResponse, { isLoading: isSubmitting }] = useSubmitResponseMutation()

  const survey = surveyData?.data?.survey

  const sortedQuestions = useMemo(
    () => [...(surveyData?.data?.questions || [])].sort((a, b) => a.order - b.order),
    [surveyData?.data?.questions]
  )

  // Build dynamic Zod schema based on questions
  const schemaFields: Record<string, z.ZodTypeAny> = {}
  sortedQuestions.forEach((question) => {
    if (question.type === "checkbox") {
      schemaFields[question.id] = question.required
        ? z.array(z.string()).min(1, "At least one option must be selected")
        : z.array(z.string()).nullable().optional()
    } else if (question.type === "rating") {
      schemaFields[question.id] = question.required
        ? z.string().min(1, "Please select a rating")
        : z.string().nullable().optional()
    } else if (question.type === "date") {
      schemaFields[question.id] = question.required
        ? z.date({ message: "Please select a date" })
        : z.date().nullable().optional()
    } else if (question.type === "likert") {
      // Likert responses are stored as objects: { "0": "option1", "1": "option2" }
      schemaFields[question.id] = question.required
        ? z.record(z.string(), z.string()).refine(
            (obj) => {
              // Ensure all statements have a selected option
              return question.statements && question.statements.every((_, idx) => obj[String(idx)])
            },
            { message: "Please select an option for all statements" }
          )
        : z.record(z.string(), z.string()).nullable().optional()
    } else {
      schemaFields[question.id] = question.required
        ? z.string().min(1, "This field is required")
        : z.string().nullable().optional()
    }
  })

  const formSchema = z.object(schemaFields)
  type FormValues = z.infer<typeof formSchema>

  // Initialize default values for all fields
  const defaultValues: Record<string, string | string[] | Date | Record<string, string> | undefined> = {}
  sortedQuestions.forEach((question) => {
    if (question.type === "checkbox") {
      defaultValues[question.id] = []
    } else if (question.type === "date") {
      defaultValues[question.id] = undefined
    } else if (question.type === "likert") {
      defaultValues[question.id] = {}
    } else {
      defaultValues[question.id] = undefined
    }
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <CardTitle>Loading Survey...</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Error state
  if (isError || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Survey Not Found</CardTitle>
            <CardDescription>
              {error && 'message' in error
                ? error.message
                : "The survey you're looking for doesn't exist or is not available."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (survey.status !== "Published") {
    const backgroundStyle = survey.background
      ? survey.background.type === "gradient"
        ? { background: survey.background.value }
        : { backgroundImage: `url(${survey.background.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {}

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={backgroundStyle}
      >
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Survey Not Available</CardTitle>
            <CardDescription>
              This survey is not currently available for responses.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: FormValues) => {
    const answers: Record<string, string | string[] | Record<string, string> | null> = {}
    
    sortedQuestions.forEach((question) => {
      const value = data[question.id]
      if (value !== undefined && value !== null) {
        if (question.type === "date" && value instanceof Date) {
          answers[question.id] = value.toISOString()
        } else if (question.type === "likert" && typeof value === "object" && !Array.isArray(value)) {
          // Likert responses are stored as objects: { "0": "option1", "1": "option2" }
          answers[question.id] = value as Record<string, string>
        } else {
          answers[question.id] = value as string | string[]
        }
      } else {
        answers[question.id] = null
      }
    })

    try {
      await submitResponse({
        surveyId,
        response: {
          answers,
        },
      }).unwrap()

      setSubmitted(true)
    } catch (error) {
      // Handle error - could show toast or error message
      console.error("Failed to submit response:", error)
    }
  }

  if (submitted) {
    const backgroundStyle = survey.background
      ? survey.background.type === "gradient"
        ? { background: survey.background.value }
        : { backgroundImage: `url(${survey.background.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {}

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={backgroundStyle}
      >
        <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              Your response has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full cursor-pointer"
              onClick={() => {
                form.reset()
                setSubmitted(false)
              }}
            >
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {sortedQuestions.map((question) => (
                  <QuestionField
                    key={question.id}
                    question={question}
                    form={form}
                  />
                ))}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    disabled={isSubmitting}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface QuestionFieldProps {
  question: Question
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: ReturnType<typeof useForm<any>>
}

function QuestionField({ question, form }: QuestionFieldProps) {
  if (question.type === "short-text") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <FormControl>
              <Input placeholder="Enter your answer" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "long-text") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <FormControl>
              <Textarea
                placeholder="Enter your answer"
                rows={4}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "multiple-choice") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                {question.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                    <label
                      htmlFor={`${question.id}-${option}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "checkbox") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={() => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <div className="space-y-2">
              {question.options?.map((option) => (
                <FormField
                  key={option}
                  control={form.control}
                  name={question.id}
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={option}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option)}
                            onCheckedChange={(checked: boolean) => {
                              return checked
                                ? field.onChange([...(field.value || []), option])
                                : field.onChange(
                                    field.value?.filter((value: string) => value !== option)
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {option}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "rating") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-row space-x-2"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(rating)} id={`${question.id}-${rating}`} />
                    <label
                      htmlFor={`${question.id}-${rating}`}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {rating}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "date") {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (question.type === "likert" && question.statements && question.options) {
    return (
      <FormField
        control={form.control}
        name={question.id}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1" htmlFor={question.id}>
              <label>{question.title}</label>
              {question.required && <span className="text-destructive">*</span>}
            </FormLabel>
            {question.description && (
              <FormDescription>{question.description}</FormDescription>
            )}
            <FormControl>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr>
                      <th className="border border-border bg-muted/50 p-2 text-left font-medium">
                        Statements
                      </th>
                      {question.options!.map((option) => (
                        <th
                          key={option}
                          className="border border-border bg-muted/50 p-2 text-center font-medium min-w-[100px]"
                        >
                          {option}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {question.statements!.map((statement, stmtIndex) => {
                      const statementKey = String(stmtIndex)
                      const currentValue = (field.value as Record<string, string>)?.[statementKey] || ""
                      return (
                        <tr
                          key={stmtIndex}
                          className={stmtIndex % 2 === 0 ? "bg-muted/30" : ""}
                        >
                          <td className="border border-border p-2 font-medium">
                            {statement}
                          </td>
                          <RadioGroup
                            value={currentValue}
                            onValueChange={(value) => {
                              const currentObj = (field.value as Record<string, string>) || {}
                              field.onChange({
                                ...currentObj,
                                [statementKey]: value,
                              })
                            }}
                            className="contents"
                          >
                            {question.options!.map((option) => (
                              <td
                                key={option}
                                className="border border-border p-2 text-center"
                              >
                                <div className="flex justify-center">
                                  <RadioGroupItem
                                    value={option}
                                    id={`${question.id}-${stmtIndex}-${option}`}
                                  />
                                </div>
                              </td>
                            ))}
                          </RadioGroup>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return null
}

