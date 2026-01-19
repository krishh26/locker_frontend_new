"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
import { useAppDispatch } from "@/store/hooks"
import {
  updateQuestion,
  deleteQuestion,
  addQuestion,
  type Question,
} from "@/store/slices/surveySlice"

interface QuestionCardProps {
  question: Question
  surveyId: string
  onEdit: (question: Question) => void
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

export function QuestionCard({ question, surveyId, onEdit }: QuestionCardProps) {
  const dispatch = useAppDispatch()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [title, setTitle] = useState(question.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (newTitle !== question.title && newTitle.trim()) {
      dispatch(
        updateQuestion({
          id: question.id,
          surveyId,
          updates: { title: newTitle },
        })
      )
    }
  }

  const handleRequiredToggle = (checked: boolean) => {
    dispatch(
      updateQuestion({
        id: question.id,
        surveyId,
        updates: { required: checked },
      })
    )
  }

  const handleDuplicate = () => {
    const { id: _id, order: _order, ...questionData } = question
    dispatch(
      addQuestion({
        ...questionData,
        surveyId,
        title: `${question.title} (Copy)`,
      })
    )
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    dispatch(deleteQuestion({ id: question.id, surveyId }))
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="hover:shadow-md transition-shadow"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {isEditingTitle ? (
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => {
                        setIsEditingTitle(false)
                        handleTitleChange(title)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setIsEditingTitle(false)
                          handleTitleChange(title)
                        }
                        if (e.key === "Escape") {
                          setTitle(question.title)
                          setIsEditingTitle(false)
                        }
                      }}
                      className="font-medium"
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="font-medium cursor-text"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      {question.title || "Untitled Question"}
                    </h3>
                  )}
                  {question.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {question.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {questionTypeLabels[question.type]}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(question)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleDuplicate}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        className="cursor-pointer"
                        onClick={handleDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={handleRequiredToggle}
                />
                <Label
                  htmlFor={`required-${question.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  Required
                </Label>
              </div>

              {question.options && question.options.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Options:</span>{" "}
                  {question.options.join(", ")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

