"use client";

import { useState, useEffect } from "react";
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
import { useUpdateLearnerCommentMutation } from "@/store/api/learner/learnerApi";
import type { LearnerListItem } from "@/store/api/learner/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LearnerCommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learner: LearnerListItem;
  onSuccess: () => void;
}

export function LearnerCommentDialog({
  open,
  onOpenChange,
  learner,
  onSuccess,
}: LearnerCommentDialogProps) {
  const [comment, setComment] = useState("");
  const [updateComment, { isLoading }] = useUpdateLearnerCommentMutation();

  useEffect(() => {
    if (learner && open) {
      setComment(learner.comment || "");
    }
  }, [learner, open]);

  const handleSubmit = async () => {
    try {
      await updateComment({
        id: learner.learner_id,
        data: { comment },
      }).unwrap();
      toast.success("Comment updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to update comment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add/Edit Comment for {learner.first_name} {learner.last_name}
          </DialogTitle>
          <DialogDescription>
            Update the comment for this learner. This comment will be visible to admins and trainers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              placeholder="Enter your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
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
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Comment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

