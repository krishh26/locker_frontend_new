"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreVertical, Pencil, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  useDeleteQuestionMutation,
  useCreateQuestionMutation,
  type Question,
} from "@/store/api/survey/surveyApi"
import { toast } from "sonner"

const questionAccentColors = [
  "border-l-sky-500 dark:border-l-sky-400",
  "border-l-rose-500 dark:border-l-rose-400",
  "border-l-emerald-500 dark:border-l-emerald-400",
  "border-l-violet-500 dark:border-l-violet-400",
  "border-l-amber-500 dark:border-l-amber-400",
  "border-l-cyan-500 dark:border-l-cyan-400",
  "border-l-fuchsia-500 dark:border-l-fuchsia-400",
  "border-l-indigo-500 dark:border-l-indigo-400",
]

interface LivePreviewQuestionProps {
  question: Question
  surveyId: string
  index: number
  onEdit: (question: Question) => void
}

export function LivePreviewQuestion({
  question,
  surveyId,
  index,
  onEdit,
}: LivePreviewQuestionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteQuestionMutation()
  const [createQuestion] = useCreateQuestionMutation()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDuplicate = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, order: _order, createdAt: _createdAt, updatedAt: _updatedAt, ...questionData } = question
    try {
      await createQuestion({
        surveyId,
        question: {
          ...questionData,
          title: `${question.title} (Copy)`,
        },
      }).unwrap()
      toast.success("Question duplicated successfully")
    } catch (error: unknown) {
      let errorMessage = "Failed to duplicate question"
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data
        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      toast.error(errorMessage)
    }
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteQuestion({
        surveyId,
        questionId: question.id,
      }).unwrap()
      toast.success("Question deleted successfully")
      setDeleteDialogOpen(false)
    } catch (error: unknown) {
      let errorMessage = "Failed to delete question"
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data
        if (errorData && typeof errorData === 'object' && 'message' in errorData) {
          errorMessage = String(errorData.message)
        }
      }
      toast.error(errorMessage)
    }
  }

  const renderQuestionField = () => {
    switch (question.type) {
      case "short-text":
        return (
          <Input
            placeholder="Short text answer"
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
        )
      case "long-text":
        return (
          <Textarea
            placeholder="Long text answer"
            disabled
            rows={4}
            className="bg-muted/50 cursor-not-allowed"
          />
        )
      case "multiple-choice":
        return (
          <RadioGroup disabled>
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${option}`} disabled />
                <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-not-allowed">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`${question.id}-${option}`} disabled />
                <Label htmlFor={`${question.id}-${option}`} className="font-normal cursor-not-allowed">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )
      case "rating":
        return (
          <RadioGroup disabled className="flex flex-row space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={String(rating)} id={`${question.id}-${rating}`} disabled />
                <Label htmlFor={`${question.id}-${rating}`} className="font-normal cursor-not-allowed">
                  {rating}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      case "date":
        return (
          <Input
            type="date"
            disabled
            className="bg-muted/50 cursor-not-allowed"
          />
        )
      case "likert":
        if (!question.statements || !question.options) {
          return (
            <p className="text-sm text-muted-foreground">
              Add statements and options to see the Likert scale matrix.
            </p>
          )
        }
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 p-2 text-left font-medium">
                    Statements
                  </th>
                  {question.options.map((option) => (
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
                {question.statements.map((statement, stmtIndex) => (
                  <tr
                    key={stmtIndex}
                    className={stmtIndex % 2 === 0 ? "bg-muted/30" : ""}
                  >
                    <td className="border border-border p-2 font-medium">
                      {statement}
                    </td>
                    {question.options!.map((option) => (
                      <td
                        key={option}
                        className="border border-border p-2 text-center"
                      >
                        <div className="flex justify-center">
                          <input
                            type="radio"
                            name={`${question.id}-${stmtIndex}`}
                            value={option}
                            id={`${question.id}-${stmtIndex}-${option}`}
                            disabled
                            className="h-4 w-4 cursor-not-allowed rounded-full border border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative flex items-start gap-3"
      >
        {/* Drag Handle - always visible but more prominent on hover */}
        <div
          {...attributes}
          {...listeners}
          className="mt-4 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-40 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical className="h-6 w-6" />
        </div>

        <div className={`relative flex-1 rounded-lg border-2 border-l-4 border-transparent hover:border-primary/30 ${questionAccentColors[index % questionAccentColors.length]} transition-colors bg-background p-4 shadow-sm hover:shadow-md`}>
          {/* 3-dot Menu - always visible but more prominent on hover */}
          <div className="absolute right-2 top-2 opacity-40 group-hover:opacity-100 transition-opacity z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(question)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDuplicate()
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Question Content */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-medium">
                {index + 1}. {question.title}
                {question.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              {question.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {question.description}
                </p>
              )}
            </div>
            <div className="mt-2">{renderQuestionField()}</div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

