"use client"

import { useState } from "react"
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
import { Plus, Eye, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/dashboard/page-header"
import {
  useGetSurveyByIdQuery,
  useGetQuestionsQuery,
  useReorderQuestionsMutation,
  useApplyTemplateMutation,
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
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  // Loading state
  if (isLoadingSurvey || isLoadingQuestions) {
    return (
      <div className="space-y-6 px-4 lg:px-6">
        <PageHeader
          title="Loading Survey..."
          subtitle="Please wait while we load the survey"
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
          title="Survey Not Found"
          subtitle={surveyError ? "Failed to load the survey. Please try again." : "The survey you're looking for doesn't exist"}
          showBackButton
          backButtonHref="/surveys"
        />
      </div>
    )
  }

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order)

  // Handle both nested structure (background.type/value) and flat structure (backgroundType/backgroundValue)
  const backgroundType = (survey as any).backgroundType || survey.background?.type
  const backgroundValue = (survey as any).backgroundValue || survey.background?.value
  
  const backgroundStyle = backgroundType && backgroundValue
    ? backgroundType === "gradient"
      ? { background: backgroundValue }
      : { backgroundImage: `url(${backgroundValue})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {}


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
        toast.success("Questions reordered successfully")
      } catch (error: unknown) {
        let errorMessage = "Failed to reorder questions"
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
      toast.success("Template applied successfully!")
    } catch (error: unknown) {
      let errorMessage = "Failed to apply template. Please try again."
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
        subtitle={survey.description || "Build your survey questions"}
        showBackButton
        backButtonHref="/surveys"
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Questions</h2>
            <p className="text-sm text-muted-foreground">
              {sortedQuestions.length} question{sortedQuestions.length !== 1 ? "s" : ""}
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
              {isApplyingTemplate ? "Applying..." : "Use Template"}
            </Button>
            <Button onClick={handleAddQuestion} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        {sortedQuestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/30 p-12 text-center space-y-4 bg-primary/5">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-secondary/5 border-secondary/15 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-secondary" />
            </div>
            <p className="text-muted-foreground">
              No questions yet. Get started by using a template or adding your own questions.
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
              <div className="bg-background/95 backdrop-blur-sm rounded-lg p-6 space-y-6">
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
                      Submit
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

