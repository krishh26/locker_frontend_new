"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import {
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  type Question,
} from "@/store/api/survey/surveyApi"
import { toast } from "sonner"

const questionFormSchema = z
  .object({
    title: z.string().min(1, {
      message: "Title is required.",
    }),
    description: z.string().optional(),
    type: z.enum([
      "short-text",
      "long-text",
      "multiple-choice",
      "checkbox",
      "rating",
      "date",
      "likert",
    ]),
    required: z.boolean(),
    options: z.array(z.object({ value: z.string().min(1) })).optional(),
    statements: z.array(z.object({ value: z.string().min(1) })).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.type === "multiple-choice" || data.type === "checkbox") &&
        (!data.options || data.options.length === 0)
      ) {
        return false
      }
      if (data.type === "likert") {
        if (!data.options || data.options.length === 0) {
          return false
        }
        if (!data.statements || data.statements.length === 0) {
          return false
        }
      }
      return true
    },
    {
      message: "At least one option is required for this question type.",
      path: ["options"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "likert" && (!data.statements || data.statements.length === 0)) {
        return false
      }
      return true
    },
    {
      message: "At least one statement is required for Likert scale questions.",
      path: ["statements"],
    }
  )

type QuestionFormValues = z.infer<typeof questionFormSchema>

interface QuestionSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  question?: Question | null
}

export function QuestionSettings({
  open,
  onOpenChange,
  surveyId,
  question,
}: QuestionSettingsProps) {
  const [createQuestion, { isLoading: isCreating }] = useCreateQuestionMutation()
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateQuestionMutation()

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "short-text",
      required: false,
      options: [],
      statements: [],
    },
  })

  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options",
  })

  const { fields: statementFields, append: appendStatement, remove: removeStatement } = useFieldArray({
    control: form.control,
    name: "statements",
  })

  const questionType = form.watch("type")
  const showOptions =
    questionType === "multiple-choice" || questionType === "checkbox" || questionType === "likert"
  const showStatements = questionType === "likert"

  useEffect(() => {
    if (question) {
      form.reset({
        title: question.title,
        description: question.description || "",
        type: question.type,
        required: question.required,
        options:
          question.options?.map((opt) => ({ value: opt })) || [],
        statements:
          question.statements?.map((stmt) => ({ value: stmt })) || [],
      })
    } else {
      form.reset({
        title: "",
        description: "",
        type: "short-text",
        required: false,
        options: [],
        statements: [],
      })
    }
  }, [question, form])

  useEffect(() => {
    if (showOptions && optionFields.length === 0) {
      appendOption({ value: "" })
    }
  }, [showOptions, optionFields.length, appendOption])

  useEffect(() => {
    if (showStatements && statementFields.length === 0) {
      appendStatement({ value: "" })
    }
  }, [showStatements, statementFields.length, appendStatement])

  async function onSubmit(data: QuestionFormValues) {
    const questionData = {
      title: data.title,
      description: data.description,
      type: data.type,
      required: data.required,
      options:
        showOptions && data.options
          ? data.options.map((opt) => opt.value).filter((v) => v.trim())
          : null,
      statements:
        showStatements && data.statements
          ? data.statements.map((stmt) => stmt.value).filter((v) => v.trim())
          : null,
    }

    try {
      if (question) {
        await updateQuestion({
          surveyId,
          questionId: question.id,
          updates: questionData,
        }).unwrap()
        toast.success("Question updated successfully")
      } else {
        await createQuestion({
          surveyId,
          question: questionData,
        }).unwrap()
        toast.success("Question created successfully")
      }
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      let errorMessage = question ? "Failed to update question" : "Failed to create question"
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data
        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit Question" : "Add Question"}
          </DialogTitle>
          <DialogDescription>
            {question
              ? "Update the question details."
              : "Create a new question for your survey."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter question title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter question description (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder="Select question type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short-text">Short Text</SelectItem>
                      <SelectItem value="long-text">Long Text</SelectItem>
                      <SelectItem value="multiple-choice">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="likert">Likert Scale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showStatements && (
              <FormField
                control={form.control}
                name="statements"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Statements (Rows)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendStatement({ value: "" })}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Statement
                      </Button>
                    </div>
                    <FormDescription>
                      Add statements for the Likert scale (one per row).
                    </FormDescription>
                    <div className="space-y-2">
                      {statementFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`statements.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder={`Statement ${index + 1}`}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStatement(index)}
                            className="cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {statementFields.length === 0 && (
                      <p className="text-sm text-destructive">
                        At least one statement is required.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showOptions && (
              <FormField
                control={form.control}
                name="options"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Options</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendOption({ value: "" })}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                    <FormDescription>
                      {questionType === "likert"
                        ? "Add rating scale options for the Likert scale (columns)."
                        : questionType === "multiple-choice"
                        ? "Add options for multiple choice questions."
                        : "Add options for checkbox questions."}
                    </FormDescription>
                    <div className="space-y-2">
                      {optionFields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name={`options.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input
                                    placeholder={`Option ${index + 1}`}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {optionFields.length === 0 && (
                      <p className="text-sm text-destructive">
                        At least one option is required.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required</FormLabel>
                    <FormDescription>
                      Make this question mandatory for respondents.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!form.formState.isValid || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (question ? "Updating..." : "Creating...")
                  : (question ? "Update Question" : "Add Question")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

