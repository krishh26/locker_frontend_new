"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  useGetSurveyByIdQuery,
  useGetQuestionsQuery,
  useReorderQuestionsMutation,
  useApplyTemplateMutation,
  useUpdateSurveyMutation,
} from "@/store/api/survey/surveyApi"
import { type CreateQuestionRequest } from "@/store/api/survey/types"
import { toast } from "sonner"
import { QuestionSettings } from "./question-settings"
import { TemplateSelector } from "./template-selector"
import { LivePreviewQuestion } from "./live-preview-question"
import { type Question } from "@/store/api/survey/surveyApi"
import { type SurveyTemplate } from "./templates"

interface SurveyBuilderProps {
  surveyId: string
}

export function SurveyBuilder({ surveyId }: SurveyBuilderProps) {
  const t = useTranslations("surveys")
  // Fetch survey from API
  const { data: surveyResponse, isLoading: isLoadingSurvey, error: surveyError } = useGetSurveyByIdQuery(surveyId)
  const survey = surveyResponse?.data?.survey
  
  // Fetch questions from API
  const { data: questionsResponse, isLoading: isLoadingQuestions } = useGetQuestionsQuery(surveyId, {
    skip: !surveyId,
  })
  const questions = questionsResponse?.data?.questions || []
  
  const [reorderQuestions] = useReorderQuestionsMutation()
  const [applyTemplate, { isLoading: isApplyingTemplate }] = useApplyTemplateMutation()
  const [updateSurvey, { isLoading: isUpdatingBackground }] = useUpdateSurveyMutation()
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [backgroundUrlInput, setBackgroundUrlInput] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  // Handle both nested structure (background.type/value) and flat structure (backgroundType/backgroundValue)
  const surveyRecord = survey as Record<string, unknown> | undefined
  const legacyBackgroundType = surveyRecord?.backgroundType
  const legacyBackgroundValue = surveyRecord?.backgroundValue
  const backgroundType =
    (legacyBackgroundType === "gradient" || legacyBackgroundType === "image"
      ? legacyBackgroundType
      : undefined) || survey?.background?.type
  const backgroundValue =
    (typeof legacyBackgroundValue === "string" ? legacyBackgroundValue : undefined) ||
    survey?.background?.value
  
  const backgroundStyle = backgroundType && backgroundValue
    ? backgroundType === "gradient"
      ? { background: backgroundValue }
      : { backgroundImage: `url(${backgroundValue})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {}

  useEffect(() => {
    if (backgroundType === "image" && backgroundValue) {
      setBackgroundUrlInput(backgroundValue)
      return
    }
    setBackgroundUrlInput("")
  }, [backgroundType, backgroundValue])

  // Loading state
  if (isLoadingSurvey || isLoadingQuestions) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title={t("builder.loadingTitle")}
          subtitle={t("builder.loadingSubtitle")}
          showBackButton
          backButtonHref="/surveys"
        />
      </div>
    )
  }

  // Error or not found state
  if (surveyError || !survey) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title={t("builder.notFoundTitle")}
          subtitle={
            surveyError
              ? t("builder.notFoundSubtitleError")
              : t("builder.notFoundSubtitleMissing")
          }
          showBackButton
          backButtonHref="/surveys"
        />
      </div>
    )
  }

  const handleApplyBackgroundImage = async () => {
    const trimmedUrl = backgroundUrlInput.trim()

    if (!trimmedUrl) {
      toast.error(t("builder.backgroundUrlRequired"))
      return
    }

    try {
      new URL(trimmedUrl)
    } catch {
      toast.error(t("builder.backgroundUrlInvalid"))
      return
    }

    try {
      await updateSurvey({
        surveyId,
        updates: {
          background: {
            type: "image",
            value: trimmedUrl,
          },
        },
      }).unwrap()
      toast.success(t("builder.backgroundApplySuccess"))
    } catch (error: unknown) {
      let errorMessage = t("builder.backgroundApplyFailed")
      if (error && typeof error === "object" && "data" in error) {
        const errorData = error.data
        if (errorData && typeof errorData === "object" && "message" in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      toast.error(errorMessage)
    }
  }

  const handleRemoveBackgroundImage = async () => {
    try {
      await updateSurvey({
        surveyId,
        updates: {
          background: null as never,
        },
      }).unwrap()
      setBackgroundUrlInput("")
      toast.success(t("builder.backgroundRemoveSuccess"))
    } catch (error: unknown) {
      let errorMessage = t("builder.backgroundRemoveFailed")
      if (error && typeof error === "object" && "data" in error) {
        const errorData = error.data
        if (errorData && typeof errorData === "object" && "message" in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      toast.error(errorMessage)
    }
  }


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id)
      const newIndex = sortedQuestions.findIndex((q) => q.id === over.id)

      const newOrder = arrayMove(sortedQuestions, oldIndex, newIndex)
      const questionIds = newOrder.map((q) => q.id)

      try {
        await reorderQuestions({
          surveyId,
          questionIds,
        }).unwrap()
        toast.success(t("builder.reorderToastSuccess"))
      } catch (error: unknown) {
        let errorMessage = t("builder.reorderToastFailed")
        if (error && typeof error === 'object' && 'data' in error) {
          const errorData = error.data
          if (errorData && typeof errorData === 'object' && 'message' in errorData) {
            errorMessage = String(errorData.message)
          }
        }
        toast.error(errorMessage)
      }
    }
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setSettingsOpen(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setSettingsOpen(true)
  }

  const handleSelectTemplate = async (template: SurveyTemplate) => {
    if (!survey) return

    try {
      // Calculate starting order based on existing questions count
      // This ensures template questions are appended after existing questions
      const existingQuestionsCount = questions.length
      
      // Prepare template questions with proper order values
      const templateQuestions: CreateQuestionRequest[] = template.questions.map((q, index) => ({
        title: q.title,
        description: q.description,
        type: q.type,
        required: q.required,
        options: q.options || null,
        order: existingQuestionsCount + index, // Append after existing questions
      }))

      // Call API to apply template (background + questions in one call)
      await applyTemplate({
        surveyId,
        template: {
          background: template.background,
          questions: templateQuestions,
        },
      }).unwrap()

      // Close template selector on success
      setTemplateSelectorOpen(false)
      toast.success(t("builder.templateApplySuccess"))
    } catch (error: unknown) {
      let errorMessage = t("builder.templateApplyFailed")
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
    <div className="space-y-6 px-4 lg:px-6">
      <PageHeader
        title={survey.name}
        subtitle={survey.description || t("builder.headerFallbackDescription")}
        showBackButton
        backButtonHref="/surveys"
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {t("builder.questionsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("builder.questionsCount", { count: sortedQuestions.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTemplateSelectorOpen(true)}
              className="cursor-pointer"
              disabled={isApplyingTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              {isApplyingTemplate
                ? t("builder.templateApplying")
                : t("builder.templateUse")}
            </Button>
            <Button onClick={handleAddQuestion} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              {t("builder.addQuestion")}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <h3 className="text-sm font-medium">{t("builder.backgroundTitle")}</h3>
            <p className="text-xs text-muted-foreground">
              {t("builder.backgroundDescription")}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              type="url"
              value={backgroundUrlInput}
              onChange={(event) => setBackgroundUrlInput(event.target.value)}
              placeholder={t("builder.backgroundUrlPlaceholder")}
              disabled={isUpdatingBackground}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleApplyBackgroundImage}
                disabled={isUpdatingBackground}
              >
                {isUpdatingBackground
                  ? t("builder.backgroundApplying")
                  : t("builder.backgroundApply")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveBackgroundImage}
                disabled={isUpdatingBackground || !backgroundValue}
              >
                {t("builder.backgroundRemove")}
              </Button>
            </div>
          </div>
        </div>

        {sortedQuestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border-primary/20 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {t("builder.emptyDescription")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateSelectorOpen(true)}
                className="cursor-pointer"
                disabled={isApplyingTemplate}
              >
                <FileText className="mr-2 h-4 w-4" />
                {isApplyingTemplate ? "Applying..." : "Use Template"}
              </Button>
              <Button onClick={handleAddQuestion} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg border p-6 min-h-[600px]"
            style={backgroundStyle}
          >
            <div className="mx-auto max-w-2xl">
              <div className="bg-background/95 backdrop-blur-sm rounded-lg p-6 space-y-6 border border-primary/20">
                {/* Survey Header */}
                <div className="space-y-2 pb-4 border-b border-primary/20">
                  <h2 className="text-2xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">{survey.name}</h2>
                  {survey.description && (
                    <p className="text-muted-foreground">{survey.description}</p>
                  )}
                </div>

                {/* Questions with Drag & Drop */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedQuestions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-6">
                      {sortedQuestions.map((question, index) => (
                        <LivePreviewQuestion
                          key={question.id}
                          question={question}
                          surveyId={surveyId}
                          index={index}
                          onEdit={handleEditQuestion}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Submit Button Preview */}
                {sortedQuestions.length > 0 && (
                  <div className="pt-4 border-t">
                    <Button
                      disabled
                      className="w-full cursor-not-allowed"
                    >
                      {t("builder.submitPreview")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <QuestionSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        surveyId={surveyId}
        question={editingQuestion}
      />

      <TemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelectTemplate={handleSelectTemplate}
      />

    </div>
  )
}

