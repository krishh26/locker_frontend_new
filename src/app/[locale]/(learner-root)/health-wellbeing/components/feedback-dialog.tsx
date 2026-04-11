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
import { formatWellbeingDisplayName } from "@/lib/wellbeing-resource-display";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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

const EMOJI_TO_LABEL_KEY = {
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
  const t = useTranslations("healthAndWellbeing");
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiKey | "">("");
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();

  const handleSubmit = async () => {
    if (!selectedEmoji) return;

    try {
      await submitFeedback({
        resourceId: resource.id,
        feedback: feedbackMapping[selectedEmoji],
      }).unwrap();

      toast.success(t("feedbackDialog.toast.success"));
      setSelectedEmoji("");
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || t("feedbackDialog.toast.failed"));
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
          <DialogTitle>{t("feedbackDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("feedbackDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <h3
              className="text-lg font-semibold line-clamp-2"
              title={resource.location || undefined}
            >
              {formatWellbeingDisplayName(resource)}
            </h3>
          </div>

          <div className="flex justify-center gap-4 py-4">
            {Object.keys(feedbackMapping).map((emoji) => {
              const emojiKey = emoji as EmojiKey;
              const isSelected = selectedEmoji === emojiKey;
              const labelKey = EMOJI_TO_LABEL_KEY[emojiKey];
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
                  title={t(`feedbackDialog.labels.${labelKey}`)}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {selectedEmoji && (
            <div className="text-center">
              <p className="text-sm font-medium text-primary">
                {t(`feedbackDialog.messages.${EMOJI_TO_LABEL_KEY[selectedEmoji]}`)}
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
            {t("feedbackDialog.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedEmoji}
            className="cursor-pointer"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? t("feedbackDialog.submitting") : t("feedbackDialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
