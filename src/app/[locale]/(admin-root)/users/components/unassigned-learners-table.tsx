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
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  isLoading?: boolean;
  currentEqaId?: number;
}

export function UnassignedLearnersTable({
  data,
  selectedIds,
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

  const allSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.every((item) => selectedIds.has(item.learner_id));
  }, [filteredData, selectedIds]);

  const someSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    return filteredData.some((item) => selectedIds.has(item.learner_id));
  }, [filteredData, selectedIds]);

  const handleSelectAll = (checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      filteredData.forEach((item) => {
        newSelection.add(item.learner_id);
      });
    } else {
      filteredData.forEach((item) => {
        newSelection.delete(item.learner_id);
      });
    }
    onSelectionChange(newSelection);
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
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
            const isSelected = selectedIds.has(learner.learner_id);
            const learnerName = `${learner.first_name} ${learner.last_name}`.trim() || learner.user_name;
            const courseInfo = getLearnerCourseInfo(learner);

            return (
              <TableRow key={learner.learner_id} className={isSelected ? "bg-muted/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleSelectItem(learner.learner_id, checked === true)
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
