"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { LearnerListItem } from "@/store/api/learner/types";
import {
  calculateLearnerProgress,
  getProgressPercentages,
} from "@/lib/learner-progress-utils";
import { getRandomColor } from "@/app/[locale]/(learner-root)/forum/utils/randomColor";

interface EmployerLearnerRowProps {
  learner: LearnerListItem;
}

export function EmployerLearnerRow({ learner }: EmployerLearnerRowProps) {
  // Calculate progress
  const progress = calculateLearnerProgress(learner);
  const percentages = getProgressPercentages(progress);

  // Generate avatar color and initials
  const avatarColor = getRandomColor(
    learner?.first_name?.toLowerCase().charAt(0)
  );
  const initials = `${learner?.first_name?.charAt(0) || ""}${
    learner?.last_name?.charAt(0) || ""
  }`.toUpperCase();

  // Get avatar URL
  const avatarUrl = learner?.avatar || learner?.user_id?.avatar?.url;

  const employerName = learner?.employer_id?.employer_name;

  // Format next visit date
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <Card className="hover:shadow-sm transition-all duration-200">
      <CardContent className="px-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar
            className="h-10 w-10 shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            <AvatarImage src={avatarUrl as string} alt={initials} />
            <AvatarFallback className="text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Learner Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/learner-dashboard/${learner.learner_id}`}
                className="text-sm font-semibold text-primary hover:underline truncate"
              >
                {learner?.first_name} {learner?.last_name}
              </Link>
              {employerName && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  • {employerName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>ID: {learner?.learner_id}</span>
              <span className="flex items-center gap-1">
                <span className="font-medium">Last Login:</span>
                {learner.updated_at ? formatDate(learner.updated_at) : "-"}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">Next Visit:</span>
                {learner.next_visit_date ? formatDate(learner.next_visit_date) : "-"}
              </span>
            </div>
          </div>

          {/* Progress - Compact inline bars */}
          {learner?.course && learner.course.length > 0 && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-accent">{percentages.completedPercent}%</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${percentages.completedPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-primary">{percentages.inProgressPercent}%</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${percentages.inProgressPercent}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">{percentages.notStartedPercent}%</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muted-foreground/40 rounded-full"
                    style={{ width: `${percentages.notStartedPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comment - Inline */}
          <div className="hidden lg:block flex-1 max-w-[200px] min-w-0">
            <p className="text-xs truncate">
              {learner?.comment || <span className="italic">No comment</span>}
            </p>
          </div>

          {/* Profile Button */}
          <Button asChild size="sm" variant="outline" className="shrink-0 h-8">
            <Link
              href={`/learner-dashboard/${learner.learner_id}`}
              className="flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
