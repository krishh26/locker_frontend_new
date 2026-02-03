"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateIQAQuestionMutation,
  useUpdateIQAQuestionMutation,
} from "@/store/api/iqa-questions/iqaQuestionsApi";
import type { IQAQuestion } from "@/store/api/iqa-questions/types";
import { toast } from "sonner";

const iqaQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
});

type IQAQuestionFormData = z.infer<typeof iqaQuestionSchema>;

interface IQAQuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: IQAQuestion | null;
  questionType: string;
  onSuccess: () => void;
}

export function IQAQuestionFormDialog({
  open,
  onOpenChange,
  question,
  questionType,
  onSuccess,
}: IQAQuestionFormDialogProps) {
  const isEditMode = !!question;
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [createQuestion, { isLoading: isCreating }] =
    useCreateIQAQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] =
    useUpdateIQAQuestionMutation();

  const form = useForm<IQAQuestionFormData>({
    resolver: zodResolver(iqaQuestionSchema),
    defaultValues: {
      question: "",
    },
  });

  useEffect(() => {
    if (question) {
      form.reset({
        question: question.question || "",
      });
    } else {
      form.reset({
        question: "",
      });
    }
    setErrorMessage("");
  }, [question, form, open]);

  const handleSubmit = async (data: IQAQuestionFormData) => {
    setErrorMessage("");

    if (!questionType || questionType === "All") {
      setErrorMessage("Please select a valid question type");
      return;
    }

    try {
      if (isEditMode && question) {
        await updateQuestion({
          id: question.id,
          payload: {
            question: data.question.trim(),
          },
        }).unwrap();
        toast.success("Question updated successfully!");
      } else {
        await createQuestion({
          questionType,
          question: data.question.trim(),
        }).unwrap();
        toast.success("Question created successfully!");
      }
      onSuccess();
    } catch (error: unknown) {
      const errorData = error as { data?: { message?: string }; message?: string };
      const errorMsg =
        errorData.data?.message || errorData.message || "Failed to save question";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEditMode ? "Edit Question" : "Add New Question"}
              </DialogTitle>
              <DialogDescription>
                Question Type: {questionType}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            {errorMessage && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="question">
                Question Text{" "}
                <Badge variant="destructive" className="ml-1">
                  Required
                </Badge>
              </Label>
              <Textarea
                id="question"
                placeholder="Enter your question here..."
                rows={5}
                {...form.register("question")}
                className="resize-none"
              />
              {form.formState.errors.question && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.question.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {form.watch("question")?.length || 0} characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Adding..."}
                </>
              ) : isEditMode ? (
                "Update Question"
              ) : (
                "Add Question"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
