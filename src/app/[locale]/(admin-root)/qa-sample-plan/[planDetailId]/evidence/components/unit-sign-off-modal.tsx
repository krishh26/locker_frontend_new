"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";

interface UnitSignOffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (comment: string, file?: File) => void | Promise<void>;
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
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setComment(defaultValue);
      setSelectedFile(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [defaultValue, open]);

  const handleSubmit = () => {
    if (!comment.trim()) {
      return;
    }
    void onSubmit(comment.trim(), selectedFile);
    setComment("");
    setSelectedFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setComment("");
    setSelectedFile(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="unit-sign-off-file">{t("optionalFileLabel")}</Label>
            <Input
              ref={fileInputRef}
              id="unit-sign-off-file"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSelectedFile(file ?? undefined);
              }}
            />
            <p className="text-xs text-muted-foreground">{t("optionalFileHint")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("cancelClose")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!comment.trim()}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
