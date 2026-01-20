"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Folder } from "lucide-react";
import type { LearnerListItem } from "@/store/api/learner/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface UnassignedLearner extends LearnerListItem {
  user_course_id?: number;
  course_status?: string;
  start_date?: string;
  end_date?: string;
  course_id?: number;
}

interface UnassignedLearnersTableProps {
  data: UnassignedLearner[];
  selectedLearners: Set<LearnerListItem>;
  onSelectionChange: (learners: Set<LearnerListItem>) => void;
  isLoading?: boolean;
  currentEqaId?: number;
}

export function UnassignedLearnersTable({
  data,
  selectedLearners,
  onSelectionChange,
  isLoading = false,
  currentEqaId,
}: UnassignedLearnersTableProps) {
  // Filter out learners already assigned to this EQA (when editing)
  const filteredData = useMemo(() => {
    if (!currentEqaId) return data;
    return data.filter((learner) => {
      // Check if learner has a course with this EQA assigned
      if (learner.course && Array.isArray(learner.course)) {
        return !learner.course.some(
          (course) => course.EQA_id === currentEqaId
        );
      }
      return true;
    });
  }, [data, currentEqaId]);

  // Create a Map for quick lookup by learner_id
  const selectedLearnersMap = useMemo(() => {
    const map = new Map<number, LearnerListItem>();
    selectedLearners.forEach((learner) => {
      map.set(learner.learner_id, learner);
    });
    return map;
  }, [selectedLearners]);

  const allSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every((item) => selectedLearnersMap.has(item.learner_id));
  }, [filteredData, selectedLearnersMap]);

  const someSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.some((item) => selectedLearnersMap.has(item.learner_id));
  }, [filteredData, selectedLearnersMap]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection = new Set(selectedLearners);
    if (checked) {
      filteredData.forEach((item) => {
        newSelection.add(item);
      });
    } else {
      // Remove learners that are in filteredData
      const filteredIds = new Set(filteredData.map((item) => item.learner_id));
      selectedLearners.forEach((learner) => {
        if (filteredIds.has(learner.learner_id)) {
          newSelection.delete(learner);
        }
      });
    }
    onSelectionChange(newSelection);
  };

  const handleSelectItem = (learner: UnassignedLearner, checked: boolean) => {
    const newSelection = new Set(selectedLearners);
    if (checked) {
      newSelection.add(learner);
    } else {
      // Find and remove the learner object from the set by ID
      const learnerToRemove = Array.from(selectedLearners).find(
        (selectedLearner) => selectedLearner.learner_id === learner.learner_id
      );
      if (learnerToRemove) {
        newSelection.delete(learnerToRemove);
      }
    }
    onSelectionChange(newSelection);
  };

  const getLearnerCourseInfo = (learner: UnassignedLearner) => {
    if (learner.course && Array.isArray(learner.course) && learner.course.length > 0) {
      // Get the first course or the course matching the selected course_id
      const courseInfo = learner.course[0];
      return {
        course_status: courseInfo.course_status || "N/A",
        start_date: courseInfo.start_date || "N/A",
        end_date: courseInfo.end_date || "N/A",
        user_course_id: courseInfo.user_course_id,
      };
    }
    return {
      course_status: "N/A",
      start_date: "N/A",
      end_date: "N/A",
      user_course_id: undefined,
    };
  };

  const formatDate = (dateString: string) => {
    if (dateString === "N/A") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>Learner Name</TableHead>
              <TableHead>Portfolio</TableHead>
              <TableHead>Course Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">No unassigned learners found</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
                className={
                  someSelected && !allSelected ? "data-[state=checked]:bg-primary/50" : ""
                }
              />
            </TableHead>
            <TableHead>Learner Name</TableHead>
            <TableHead>Portfolio</TableHead>
            <TableHead>Course Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((learner) => {
            const isSelected = selectedLearnersMap.has(learner.learner_id);
            const learnerName = `${learner.first_name} ${learner.last_name}`.trim() || learner.user_name;
            const courseInfo = getLearnerCourseInfo(learner);

            return (
              <TableRow key={learner.learner_id} className={isSelected ? "bg-muted/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleSelectItem(learner, checked === true)
                    }
                    aria-label={`Select ${learnerName}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{learnerName}</TableCell>
                <TableCell>
                  <Link
                    href={`/learner-profile?learner_id=${learner.learner_id}`}
                    className="inline-flex items-center justify-center"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`View portfolio for ${learnerName}`}
                    >
                      <Folder className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
                <TableCell>{courseInfo.course_status}</TableCell>
                <TableCell>{formatDate(courseInfo.start_date)}</TableCell>
                <TableCell>{formatDate(courseInfo.end_date)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
