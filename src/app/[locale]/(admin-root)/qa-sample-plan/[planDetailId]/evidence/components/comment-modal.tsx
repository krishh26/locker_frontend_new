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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { EvidenceItem } from "@/store/api/qa-sample-plan/types";

interface CommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: EvidenceItem | null;
  currentUserRole?: string;
  onSubmit: (comment: string) => Promise<void>;
  initialComment?: string;
  isLoading?: boolean;
}

interface ReviewData {
  completed: boolean;
  comment: string;
  signed_off_at: string | null;
  signed_off_by: string | null;
}

const getRoleBadgeVariant = (role: string, completed: boolean): "default" | "secondary" => {
  if (completed) {
    return "default";
  }
  // Role-based colors can be added via className if needed
  return "secondary";
};

const rolePriority: Record<string, number> = {
  IQA: 1,
  LIQA: 2,
  EQA: 3,
  Admin: 4,
  Trainer: 5,
  Employer: 6,
  Learner: 7,
};

export function CommentModal({
  open,
  onOpenChange,
  evidence,
  currentUserRole = "IQA",
  onSubmit,
  initialComment = "",
  isLoading = false,
}: CommentModalProps) {
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    if (open) {
      setComment(initialComment);
    }
  }, [open, initialComment]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    await onSubmit(comment.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setComment("");
    }
  };

  const getReviewsForEvidence = (evidence: EvidenceItem | null) => {
    if (!evidence || !evidence.reviews || typeof evidence.reviews !== "object") {
      return null;
    }
    return evidence.reviews as Record<string, ReviewData>;
  };

  const reviews = getReviewsForEvidence(evidence);
  const sortedReviews = reviews
    ? Object.entries(reviews).sort(([roleA], [roleB]) => {
        const priorityA = rolePriority[roleA] || 99;
        const priorityB = rolePriority[roleB] || 99;
        return priorityA - priorityB;
      })
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Add Comment</DialogTitle>
          <DialogDescription>
            Add a comment for this evidence document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {evidence && (
            <>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Evidence: <strong className="text-foreground">{evidence.title || "-"}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Assignment ID: <strong className="text-foreground">{evidence.assignment_id}</strong>
                </p>
              </div>

              {/* Existing Reviews */}
              {sortedReviews.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <h4 className="text-sm font-semibold">Existing Reviews:</h4>
                  <div className="space-y-2">
                    {sortedReviews.map(([role, reviewData]) => (
                      <div
                        key={role}
                        className="rounded-md border bg-background p-3 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getRoleBadgeVariant(role, reviewData.completed)}
                            className="text-xs"
                          >
                            {role}
                          </Badge>
                          <span
                            className={`text-xs font-medium ${
                              reviewData.completed
                                ? "text-accent"
                                : "text-muted-foreground"
                            }`}
                          >
                            {reviewData.completed ? "Completed" : "Pending"}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {reviewData.comment || "No comment"}
                        </p>
                        {reviewData.signed_off_at && (
                          <p className="text-xs text-muted-foreground">
                            Signed off: {new Date(reviewData.signed_off_at).toLocaleString()}
                            {reviewData.signed_off_by && ` by ${reviewData.signed_off_by}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="comment">
              Comment ({currentUserRole})
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter your comment here..."
              rows={4}
              className="resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !comment.trim()}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
