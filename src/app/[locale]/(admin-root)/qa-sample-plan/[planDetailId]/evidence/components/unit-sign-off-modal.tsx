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
          <DialogTitle>Unit sign off</DialogTitle>
          <DialogDescription>
            General comment for this Unit (Max 500 Characters).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="unit-comment">Comment</Label>
          <Textarea
            id="unit-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comments here..."
            rows={8}
            className="resize-none"
            maxLength={500}
          />
          {comment.length > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel / Close
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
