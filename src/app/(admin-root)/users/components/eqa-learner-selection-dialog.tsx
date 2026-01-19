"use client";

import { useState, useMemo } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UnassignedLearnersTable } from "./unassigned-learners-table";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import { useGetLearnersListQuery } from "@/store/api/learner/learnerApi";
import type { LearnerListItem } from "@/store/api/learner/types";
import { Loader2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

interface UnassignedLearner extends LearnerListItem {
  user_course_id?: number;
  course_status?: string;
  start_date?: string;
  end_date?: string;
  course_id?: number;
}

interface EqaLearnerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (selectedLearnerIds: Set<number>, courseId: number) => void;
  currentEqaId?: number;
  alreadyAssignedLearnerIds?: Set<number>;
}

export function EqaLearnerSelectionDialog({
  open,
  onOpenChange,
  onSave,
  currentEqaId,
  alreadyAssignedLearnerIds = new Set(),
}: EqaLearnerSelectionDialogProps) {
  const form = useFormContext();
  const selectedCourseForAssignment = form.watch("selectedCourseForAssignment") || "";
  
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch courses
  const { data: coursesData, isLoading: isLoadingCourses } = useGetCoursesQuery(
    { page: 1, page_size: 1000 },
    { skip: !open }
  );

  // Fetch learners for selected course
  const { data: learnersData, isLoading: isLoadingLearners } = useGetLearnersListQuery(
    {
      page,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      course_id: selectedCourseForAssignment ? Number(selectedCourseForAssignment) : undefined,
    },
    {
      skip: !open || !selectedCourseForAssignment,
    }
  );

  // Filter out already assigned learners
  const unassignedLearners = useMemo(() => {
    const learners = (learnersData?.data || []) as UnassignedLearner[];
    return learners.filter((learner) => {
      // Filter out if already in the assigned list
      if (alreadyAssignedLearnerIds.has(learner.learner_id)) {
        return false;
      }
      // Filter out if already assigned to this EQA (when editing)
      if (currentEqaId && learner.course && Array.isArray(learner.course)) {
        return !learner.course.some((course) => course.EQA_id === currentEqaId);
      }
      return true;
    });
  }, [learnersData?.data, alreadyAssignedLearnerIds, currentEqaId]);

  const handleSave = () => {
    if (selectedLearnerIds.size === 0) {
      return;
    }
    if (!selectedCourseForAssignment) {
      return;
    }
    onSave(selectedLearnerIds, Number(selectedCourseForAssignment));
    handleClose();
  };

  const handleClose = () => {
    setSelectedLearnerIds(new Set());
    setSearchTerm("");
    setPage(1);
    setPageSize(10);
    onOpenChange(false);
  };

  const courses = coursesData?.data || [];
  const totalPages = learnersData?.meta_data?.pages || 0;
  const totalItems = learnersData?.meta_data?.items || 0;

  // Create a minimal table instance for DataTablePagination
  // Since we're using manual pagination, the table instance is only needed for the component structure
  const dummyTable = useReactTable({
    data: [] as unknown[],
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Learners</DialogTitle>
          <DialogDescription>
            Select a course and choose learners to assign to this EQA user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course-select">Course</Label>
            {isLoadingCourses ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Controller
                name="selectedCourseForAssignment"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="course-select" className="w-full">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.course_id} value={String(course.course_id)}>
                          {course.course_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </div>

          {/* Search */}
          {selectedCourseForAssignment && (
            <div className="space-y-2">
              <Label htmlFor="learner-search">Search Learners</Label>
              <Input
                id="learner-search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}

          {/* Learners Table */}
          {selectedCourseForAssignment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Unassigned Learners</Label>
                {selectedLearnerIds.size > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedLearnerIds.size} learner{selectedLearnerIds.size !== 1 ? "s" : ""} selected
                  </div>
                )}
              </div>

              {isLoadingLearners ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <UnassignedLearnersTable
                    data={unassignedLearners}
                    selectedIds={selectedLearnerIds}
                    onSelectionChange={setSelectedLearnerIds}
                    isLoading={isLoadingLearners}
                    currentEqaId={currentEqaId}
                  />

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <DataTablePagination
                      table={dummyTable}
                      manualPagination={true}
                      currentPage={page}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize);
                        setPage(1); // Reset to first page when page size changes
                      }}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {!selectedCourseForAssignment && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Please select a course to view learners
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
          type="button"
            onClick={handleSave}
            disabled={selectedLearnerIds.size === 0 || !selectedCourseForAssignment}
          >
            <Users className="mr-2 h-4 w-4" />
            Save ({selectedLearnerIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
