"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubmitFeedbackMutation } from "@/store/api/health-wellbeing/healthWellbeingApi";
import { toast } from "sonner";
import type { WellbeingResource } from "@/store/api/health-wellbeing/types";
import { Loader2 } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: WellbeingResource;
  onSuccess?: () => void;
}

const feedbackMapping = {
  "😊": "very_helpful",
  "🙂": "helpful",
  "😐": "neutral",
  "😕": "not_helpful",
} as const;

const feedbackLabels = {
  "😊": "Very Helpful",
  "🙂": "Helpful",
  "😐": "Neutral",
  "😕": "Not Helpful",
} as const;

const feedbackMessages = {
  "😊": "Great! This resource was very helpful",
  "🙂": "Good! This resource was helpful",
  "😐": "Okay, this resource was okay",
  "😕": "This resource could be improved",
} as const;

type EmojiKey = keyof typeof feedbackMapping;

export function FeedbackDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: FeedbackDialogProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiKey | "">("");
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();

  const handleSubmit = async () => {
    if (!selectedEmoji) return;

    try {
      await submitFeedback({
        resourceId: resource.id,
        feedback: feedbackMapping[selectedEmoji],
      }).unwrap();

      toast.success("Feedback submitted successfully!");
      setSelectedEmoji("");
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || "Failed to submit feedback. Please try again.");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedEmoji("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was this resource for you?</DialogTitle>
          <DialogDescription>
            Please select an emoji to rate your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{resource.resource_name}</h3>
          </div>

          <div className="flex justify-center gap-4 py-4">
            {Object.keys(feedbackMapping).map((emoji) => {
              const emojiKey = emoji as EmojiKey;
              const isSelected = selectedEmoji === emojiKey;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emojiKey)}
                  disabled={isSubmitting}
                  className={`
                    text-4xl p-3 rounded-full transition-all
                    hover:scale-110 hover:bg-muted
                    ${isSelected ? "bg-primary text-primary-foreground scale-110" : ""}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  title={feedbackLabels[emojiKey]}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {selectedEmoji && (
            <div className="text-center">
              <p className="text-sm font-medium text-primary">
                {feedbackMessages[selectedEmoji as EmojiKey]}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmoji}
            className="cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
