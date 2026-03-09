"use client"

import { useEffect, useMemo } from "react"
import { useTranslations } from "next-intl"
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

function getQuestionFormSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, {
        message: t("builder.formTitleRequired"),
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
        message: t("builder.formOptionsRequiredForType"),
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
        message: t("builder.formStatementsRequiredForLikert"),
        path: ["statements"],
      }
    )
}

type QuestionFormValues = z.infer<ReturnType<typeof getQuestionFormSchema>>

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
  const t = useTranslations("surveys")
  const questionFormSchema = useMemo(() => getQuestionFormSchema(t), [t])
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
        toast.success(t("builder.formToastUpdateSuccess"))
      } else {
        await createQuestion({
          surveyId,
          question: questionData,
        }).unwrap()
        toast.success(t("builder.formToastCreateSuccess"))
      }
      form.reset()
      onOpenChange(false)
    } catch (error: unknown) {
      let errorMessage = question
        ? t("builder.formToastUpdateFailed")
        : t("builder.formToastCreateFailed")
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
            {question ? t("builder.formDialogTitleEdit") : t("builder.formDialogTitleCreate")}
          </DialogTitle>
          <DialogDescription>
            {question
              ? t("builder.formDialogDescriptionEdit")
              : t("builder.formDialogDescriptionCreate")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("builder.formTitleLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("builder.formTitlePlaceholder")}
                      {...field}
                    />
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
                  <FormLabel>{t("builder.formDescriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("builder.formDescriptionPlaceholder")}
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
                  <FormLabel>{t("builder.formTypeLabel")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="cursor-pointer w-full">
                        <SelectValue placeholder={t("builder.formTypePlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short-text">
                        {t("builder.formTypeShortText")}
                      </SelectItem>
                      <SelectItem value="long-text">
                        {t("builder.formTypeLongText")}
                      </SelectItem>
                      <SelectItem value="multiple-choice">
                        {t("builder.formTypeMultipleChoice")}
                      </SelectItem>
                      <SelectItem value="checkbox">
                        {t("builder.formTypeCheckbox")}
                      </SelectItem>
                      <SelectItem value="rating">
                        {t("builder.formTypeRating")}
                      </SelectItem>
                      <SelectItem value="date">
                        {t("builder.formTypeDate")}
                      </SelectItem>
                      <SelectItem value="likert">
                        {t("builder.formTypeLikert")}
                      </SelectItem>
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
                      <FormLabel>{t("builder.formStatementsLabel")}</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendStatement({ value: "" })}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("builder.formStatementsAdd")}
                      </Button>
                    </div>
                    <FormDescription>
                      {t("builder.formStatementsHelp")}
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
                        {t("builder.formStatementsInlineRequired")}
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
                      <FormLabel>{t("builder.formOptionsLabel")}</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendOption({ value: "" })}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("builder.formOptionsAdd")}
                      </Button>
                    </div>
                    <FormDescription>
                      {questionType === "likert"
                        ? t("builder.formOptionsHelpLikert")
                        : questionType === "multiple-choice"
                        ? t("builder.formOptionsHelpMultipleChoice")
                        : t("builder.formOptionsHelpCheckbox")}
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
                        {t("builder.formOptionsInlineRequired")}
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
                    <FormLabel className="text-base">
                      {t("builder.formRequiredLabel")}
                    </FormLabel>
                    <FormDescription>
                      {t("builder.formRequiredDescription")}
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
                {t("form.cancel")}
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!form.formState.isValid || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (question ? t("builder.formSubmitUpdating") : t("builder.formSubmitCreating"))
                  : (question ? t("builder.formSubmitUpdate") : t("builder.formSubmitCreate"))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

