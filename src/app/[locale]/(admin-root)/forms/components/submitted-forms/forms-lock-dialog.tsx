"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SubmittedForm } from "@/store/api/forms/types";
import { useState } from "react";

interface FormsLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SubmittedForm | null;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export function FormsLockDialog({
  open,
  onOpenChange,
  form,
  onConfirm,
  isLoading,
}: FormsLockDialogProps) {
  const t = useTranslations("forms");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-secondary" />
            {t("submittedForms.lockDialog.title")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("submittedForms.lockDialog.description", {
              formName: form?.form.form_name ?? "",
              userName: form?.user.user_name ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="lock-reason">{t("submittedForms.lockDialog.reasonLabel")}</Label>
          <Textarea
            id="lock-reason"
            placeholder={t("submittedForms.lockDialog.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {t("submittedForms.lockDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {isLoading ? t("submittedForms.lockDialog.submitting") : t("submittedForms.lockDialog.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

