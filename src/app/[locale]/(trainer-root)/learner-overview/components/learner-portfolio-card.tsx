"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User,
  MessageSquare,
  Edit,
  LayoutDashboard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { getRandomColor } from "@/app/[locale]/(learner-root)/forum/utils/randomColor";
import { useUpdateLearnerCommentMutation } from "@/store/api/learner/learnerApi";
import type { LearnerListItem } from "@/store/api/learner/types";
import { calculateLearnerProgress } from "@/lib/learner-progress-utils";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface LearnerPortfolioCardProps {
  learner: LearnerListItem;
  onCommentUpdate: () => void;
}

export function LearnerPortfolioCard({
  learner,
  onCommentUpdate,
}: LearnerPortfolioCardProps) {
  const t = useTranslations("learnerOverview");
  const router = useRouter();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState("");
  const [updateComment, { isLoading: isSavingComment }] =
    useUpdateLearnerCommentMutation();

  const {
    totalCompleted,
    totalInProgress,
    totalNotStarted,
    completionPercentage,
  } = calculateLearnerProgress(learner);

  const handleOpenCommentDialog = () => {
    setIsEditingComment(true);
    setEditedComment(learner?.comment || "");
  };

  const handleCloseCommentDialog = () => {
    setIsEditingComment(false);
    setEditedComment("");
  };

  const handleSaveComment = async () => {
    try {
      await updateComment({
        id: learner.learner_id,
        data: { comment: editedComment },
      }).unwrap();
      toast.success(t("card.commentUpdatedSuccess"));
      onCommentUpdate();
      handleCloseCommentDialog();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || t("card.commentUpdateFailed"));
    }
  };

  const avatarColor = getRandomColor(
    learner?.first_name?.toLowerCase().charAt(0),
  );
  const initials = `${learner?.first_name?.charAt(0) || ""}${
    learner?.last_name?.charAt(0) || ""
  }`.toUpperCase();

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 px-4">
            {/* Section 1: Learner Info */}
            <div className="flex-1 md:flex-2 flex items-center gap-4 p-4 rounded-lg border">
              <Avatar
                className="h-12 w-12 md:h-14 md:w-14 shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                <AvatarImage
                  src={
                    (
                      learner as LearnerListItem & {
                        avatar?: { url?: string };
                        user_id?: { avatar?: { url?: string } };
                      }
                    )?.avatar?.url ||
                    (
                      learner as LearnerListItem & {
                        user_id?: { avatar?: { url?: string } };
                      }
                    )?.user_id?.avatar?.url
                  }
                  alt={initials}
                />
                <AvatarFallback className="text-lg md:text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg md:text-xl font-bold mb-2 truncate">
                  {learner?.first_name} {learner?.last_name}
                </h3>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">
                      ID: {learner?.learner_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold truncate max-w-[200px]">
                      {learner?.comment || t("card.noComment")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleOpenCommentDialog}
                    >
                      <Edit className="h-3 w-3 text-blue-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {learner?.course && learner.course.length > 0 && (
              <div className="flex-1 md:flex-[1.5] p-4 rounded-lg border border-primary flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm md:text-base font-bold text-primary">
                    {t("card.overallProgress")}
                  </span>
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    {completionPercentage.toFixed(0)}%
                  </Badge>
                </div>

                <Progress
                  value={Math.min(completionPercentage, 100)}
                  className="h-2 md:h-3 mb-2"
                />

                <div className="flex justify-between gap-2 text-xs md:text-sm">
                  <div className="text-center flex-1">
                    <span className="font-semibold text-green-600">
                      ✓ {totalCompleted}
                    </span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="font-semibold text-yellow-600">
                      ⟳ {totalInProgress}
                    </span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="font-semibold text-red-600">
                      ○ {totalNotStarted}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 md:flex-[0.8] flex items-center justify-center">
              <Button
                onClick={() => {
                  if (learner?.learner_id) {
                    router.push(`/learner-dashboard/${learner.learner_id}`);
                  }
                }}
                className="w-full md:w-auto"
                size="lg"
                disabled={!learner?.learner_id}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {t("card.viewPortfolio")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditingComment} onOpenChange={setIsEditingComment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("card.editCommentTitle")}</DialogTitle>
            <DialogDescription>
              {t("card.editCommentDescription", {
                name:
                  `${learner?.first_name ?? ""} ${learner?.last_name ?? ""}`.trim() ||
                  "—",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">{t("card.commentLabel")}</Label>
              <Textarea
                id="comment"
                placeholder={t("card.commentPlaceholder")}
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={isSavingComment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseCommentDialog}
              disabled={isSavingComment}
            >
              {t("card.cancel")}
            </Button>
            <Button onClick={handleSaveComment} disabled={isSavingComment}>
              {isSavingComment && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSavingComment ? t("card.saving") : t("card.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
