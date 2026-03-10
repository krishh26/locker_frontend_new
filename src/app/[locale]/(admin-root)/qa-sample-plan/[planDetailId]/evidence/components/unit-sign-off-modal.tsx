"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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

interface UnitSignOffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (comment: string) => void;
  defaultValue?: string;
}

export function UnitSignOffModal({
  open,
  onOpenChange,
  onSubmit,
  defaultValue = "",
}: UnitSignOffModalProps) {
  const t = useTranslations("qaSamplePlan.evidence.unitSignOffModal");
  const [comment, setComment] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setComment(defaultValue);
    }
  }, [defaultValue, open]);

  const handleSubmit = () => {
    if (!comment.trim()) {
      return;
    }
    onSubmit(comment.trim());
    setComment("");
  };

  const handleClose = () => {
    setComment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="unit-comment">{t("commentLabel")}</Label>
          <Textarea
            id="unit-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={8}
            className="resize-none"
            maxLength={500}
          />
          {comment.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              {t("charactersCount", { count: comment.length })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("cancelClose")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
