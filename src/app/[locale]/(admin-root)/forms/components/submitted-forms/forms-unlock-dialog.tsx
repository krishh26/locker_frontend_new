"use client";

import { LockOpen } from "lucide-react";
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

interface FormsUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SubmittedForm | null;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

export function FormsUnlockDialog({
  open,
  onOpenChange,
  form,
  onConfirm,
  isLoading,
}: FormsUnlockDialogProps) {
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
            <LockOpen className="h-5 w-5 text-accent" />
            Unlock Form
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to unlock the form: <strong>{form?.form.form_name}</strong> for user{" "}
            <strong>{form?.user.user_name}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="unlock-reason">
            Reason for Unlocking (Optional)
          </Label>
          <Textarea
            id="unlock-reason"
            placeholder="Please provide a reason for unlocking this form..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isLoading ? "Unlocking..." : "Unlock Form"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

