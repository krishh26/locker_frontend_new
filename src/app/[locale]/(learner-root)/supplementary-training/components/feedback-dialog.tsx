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
import { useSubmitSupTrainingFeedbackMutation } from "@/store/api/supplementary-training/supplementaryTrainingApi";
import { toast } from "sonner";
import type { SupplementaryTrainingResource } from "@/store/api/supplementary-training/types";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: SupplementaryTrainingResource;
  onSuccess?: () => void;
}

const feedbackMapping = {
  "😊": "very_helpful",
  "🙂": "helpful",
  "😐": "neutral",
  "😕": "not_helpful",
} as const;

const feedbackLabels = {
  "😊": "veryHelpful",
  "🙂": "helpful",
  "😐": "neutral",
  "😕": "notHelpful",
} as const;

const feedbackMessages = {
  "😊": "veryHelpful",
  "🙂": "helpful",
  "😐": "neutral",
  "😕": "notHelpful",
} as const;

type EmojiKey = keyof typeof feedbackMapping;

export function FeedbackDialog({
  open,
  onOpenChange,
  resource,
  onSuccess,
}: FeedbackDialogProps) {
  const t = useTranslations("supplementaryTraining.learner.feedbackDialog");
  const commonT = useTranslations("common");
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiKey | "">("");
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitSupTrainingFeedbackMutation();

  const handleSubmit = async () => {
    if (!selectedEmoji) return;

    try {
      await submitFeedback({
        resourceId: resource.id,
        feedback: feedbackMapping[selectedEmoji],
      }).unwrap();

      toast.success(t("toast.submittedSuccess"));
      setSelectedEmoji("");
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || t("toast.submitFailed"));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedEmoji("");
      onOpenChange(false);
    }
  };

  const displayName = resource.resource_name?.trim() || resource.location || "—";
  const titleTooltip =
    [resource.resource_name?.trim(), resource.location?.trim()].filter(Boolean).join(" — ") ||
    displayName;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(100vw-2rem,28rem)] max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 min-w-0 flex-col gap-4 py-2">
          <div className="w-full min-w-0 max-w-full shrink-0">
            <h3
              className="max-h-[min(28vh,7.5rem)] overflow-y-auto wrap-anywhere text-center text-base font-semibold leading-snug break-all text-foreground sm:text-lg"
              title={titleTooltip}
            >
              {displayName}
            </h3>
          </div>

          <div className="flex shrink-0 flex-wrap justify-center gap-3 py-2 sm:gap-4">
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
                  title={t(`labels.${feedbackLabels[emojiKey]}`)}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {selectedEmoji && (
            <div className="text-center">
              <p className="text-sm font-medium text-primary">
                {t(`messages.${feedbackMessages[selectedEmoji as EmojiKey]}`)}
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
            {commonT("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmoji}
            className="cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
