"use client";

import { useState, useMemo, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslations } from "next-intl";
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
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
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
  onSave: (selectedLearners: Set<LearnerListItem>, courseId: number) => void;
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
  const t = useTranslations("users.learnerSelection");
  const common = useTranslations("common");
  // Use internal state for course selection instead of form state
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  
  const [selectedLearners, setSelectedLearners] = useState<Set<LearnerListItem>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Fetch courses
  const { data: coursesData, isLoading: isLoadingCourses, isError: isCoursesError } = useCachedCoursesList({
    skip: !open,
  });

  const courses = coursesData?.data || [];
  const selectedCourse = selectedCourseId
    ? courses.find((c) => String(c.course_id) === selectedCourseId)
    : undefined;
  const selectedCourseOrganisationId = selectedCourse?.organisation_id;

  // Fetch learners for selected course (filter by course's organisation when available)
  const {
    data: learnersData,
    isLoading: isLoadingLearners,
    isFetching: isFetchingLearners,
    isError: isLearnersError,
  } = useGetLearnersListQuery(
    {
      page,
      page_size: pageSize,
      keyword: debouncedSearch || undefined,
      course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
      organisation_id: selectedCourseOrganisationId,
    },
    {
      skip: !open || !selectedCourseId,
    }
  );

  // Clear selections and reset state when course changes
  useEffect(() => {
    if (selectedCourseId) {
      setSelectedLearners(new Set());
      setSearchTerm("");
      setPage(1);
    }
  }, [selectedCourseId]);

  // Filter out already assigned learners
  // Only use data if it matches the current course_id to avoid showing stale data
  const unassignedLearners = useMemo(() => {
    // Don't show data if we're fetching or if course_id doesn't match
    if (isFetchingLearners || !selectedCourseId) {
      return [];
    }
    
    const learners = (learnersData?.data || []) as UnassignedLearner[];
    const courseId = selectedCourseId ? Number(selectedCourseId) : null;
    
    // Verify that learners belong to the selected course
    const filteredLearners = learners.filter((learner) => {
      // Filter by course's organisation when both are present (multi-tenant)
      if (
        selectedCourseOrganisationId != null &&
        learner.organisation_id != null &&
        learner.organisation_id !== selectedCourseOrganisationId
      ) {
        return false;
      }
      // Filter out if already in the assigned list for this course
      if (alreadyAssignedLearnerIds.has(learner.learner_id)) {
        return false;
      }
      // Filter out if already assigned to this EQA (when editing)
      if (currentEqaId && learner.course && Array.isArray(learner.course) && courseId) {
        return !learner.course.some(
          (course) => course.EQA_id === currentEqaId && course.course?.course_id === courseId
        );
      }
      return true;
    });
    
    return filteredLearners;
  }, [learnersData?.data, alreadyAssignedLearnerIds, currentEqaId, selectedCourseId, selectedCourseOrganisationId, isFetchingLearners]);

  const handleSave = () => {
    if (selectedLearners.size === 0) {
      return;
    }
    if (!selectedCourseId) {
      return;
    }
    onSave(selectedLearners, Number(selectedCourseId));
    handleClose();
  };

  const handleClose = () => {
    setSelectedLearners(new Set());
    setSelectedCourseId(""); // Reset course selection
    setSearchTerm("");
    setPage(1);
    setPageSize(10);
    onOpenChange(false);
  };

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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label htmlFor="course-select">{t("course")}</Label>
            {isLoadingCourses ? (
              <Skeleton className="h-10 w-full" />
            ) : isCoursesError ? (
              <p className="text-sm text-destructive">{t("errorLoadingLearners")}</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noCoursesAvailable")}</p>
            ) : (
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger id="course-select" className="w-full">
                  <SelectValue placeholder={t("coursePlaceholder")} />
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
          </div>

          {/* Search */}
          {selectedCourseId && (
            <div className="space-y-2">
              <Label htmlFor="learner-search">{t("searchLearners")}</Label>
              <Input
                id="learner-search"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}

          {/* Learners Table */}
          {selectedCourseId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("unassignedLearners")}</Label>
                {selectedLearners.size > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedLearners.size} {selectedLearners.size !== 1 ? t("learnersSelectedPlural") : t("learnersSelected")}
                  </div>
                )}
              </div>

              {isLoadingLearners || isFetchingLearners ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isLearnersError ? (
                <div className="flex items-center justify-center py-8 text-sm text-destructive">
                  {t("errorLoadingLearners")}
                </div>
              ) : unassignedLearners.length === 0 && (totalItems === 0 || (learnersData?.data?.length ?? 0) === 0) ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {t("noLearnersInCourse")}
                </div>
              ) : (
                <>
                  <UnassignedLearnersTable
                    data={unassignedLearners}
                    selectedLearners={selectedLearners}
                    onSelectionChange={setSelectedLearners}
                    isLoading={isLoadingLearners || isFetchingLearners}
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

          {!selectedCourseId && (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {t("pleaseSelectCourse")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {common("cancel")}
          </Button>
          <Button
          type="button"
            onClick={handleSave}
            disabled={selectedLearners.size === 0 || !selectedCourseId}
          >
            <Users className="mr-2 h-4 w-4" />
            {common("save")} ({selectedLearners.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
