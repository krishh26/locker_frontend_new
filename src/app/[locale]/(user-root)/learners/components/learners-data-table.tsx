"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Download,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Upload,
  BookOpen,
  Folder,
  FileText,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  useGetLearnersListQuery,
  useDeleteLearnerMutation,
  useGetEqaAssignedLearnersQuery,
} from "@/store/api/learner/learnerApi";
import type { LearnerListItem, LearnerFilters, LearnerCourse } from "@/store/api/learner/types";
import { LearnersFormDialog } from "./learners-form-dialog";
import { LearnerCommentDialog } from "./learner-comment-dialog";
import { LearnersCsvUploadDialog } from "./learners-csv-upload-dialog";
import { EmployerLearnerRow } from "./employer-learner-row";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { exportTableToPdf } from "@/utils/pdfExport";
import Link from "next/link";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import { useGetEmployersQuery } from "@/store/api/employer/employerApi";

const statusOptions = [
  "Awaiting Induction",
  "Certificated",
  "Completed",
  "Early Leaver",
  "Exempt",
  "In Training",
  "IQA Approved",
  "Training Suspended",
  "Transferred",
  "Show only archived users",
];

// Date formatting helper
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

export function LearnersDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isAdmin = userRole === "Admin";
  const isTrainer = userRole === "Trainer";
  const isEmployer = userRole === "Employer";
  const isEqa = userRole === "EQA";
  
  const canEditComments = isAdmin || isTrainer;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [employerFilter, setEmployerFilter] = useState<string>("all");
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>(
    statusOptions.reduce((acc, status) => ({ ...acc, [status]: false }), {})
  );
  const [filters, setFilters] = useState<LearnerFilters>({
    page: 1,
    page_size: 10,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLearner, setEditingLearner] = useState<LearnerListItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [learnerToDelete, setLearnerToDelete] = useState<LearnerListItem | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [learnerForComment, setLearnerForComment] = useState<LearnerListItem | null>(null);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);

  // Client-side pagination state removed - all roles now use server-side pagination

  // Fetch courses and employers for filters
  const { data: coursesData, isLoading: isLoadingCourses } = useCachedCoursesList({
    skip: isEqa, // Skip for EQA role
  });
  const { data: employersData, isLoading: isLoadingEmployers } = useGetEmployersQuery(
    { page: 1, page_size: 1000 },
    { skip: !isAdmin || isEqa } // Only fetch for Admin, not EQA
  );

  const courseOptions = coursesData?.data ?? [];
  const employerOptions = employersData?.data ?? [];

  // Unified filters for all roles using the same API with server-side pagination and meta=true
  const unifiedFilters: LearnerFilters = useMemo(() => {
    const baseFilters: LearnerFilters = {
      page: filters.page,
      page_size: filters.page_size,
      keyword: filters.keyword,
      course_id: filters.course_id,
      status: filters.status,
    };

    if (isAdmin) {
      return {
        ...baseFilters,
        employer_ids: filters.employer_id,
      };
    }
    if (isTrainer) {
      return {
        ...baseFilters,
        user_id: user?.id ? Number(user.id) : undefined,
        role: user?.role || undefined,
      };
    }
    if (isEmployer) {
      // Extract employer IDs from assigned_employers array
      const assignedEmployers = user?.assigned_employers;
      const employerIds: number[] = Array.isArray(assignedEmployers) && assignedEmployers.length > 0
        ? assignedEmployers
            .map((employer: { employer_id: number }) => employer.employer_id)
            .filter((id): id is number => typeof id === 'number' && !isNaN(id))
        : [];
      // Pass all employer IDs as comma-separated string
      return {
        ...baseFilters,
        employer_ids: employerIds.length > 0 
          ? (employerIds.length === 1 ? employerIds[0] : employerIds.join(',') as unknown as string)
          : undefined,
      };
    }
    return baseFilters;
  }, [isAdmin, isTrainer, isEmployer, user?.id, user?.role, user?.assigned_employers, filters.page, filters.page_size, filters.keyword, filters.course_id, filters.status, filters.employer_id]);
  // Single unified API query for all roles with meta=true (handled by API)
  const { data, isLoading, refetch } = useGetLearnersListQuery(unifiedFilters, {
    skip: isEqa || (!isAdmin && !isTrainer && !isEmployer) || 
          (isTrainer && (!user?.id || !user?.role)) || 
          (isEmployer && !user?.user_id),
  });

  // EQA API query for assigned learners with pagination
  const eqaUserId = user?.user_id ? Number(user.user_id) : 0;
  const { data: eqaData, isLoading: isEqaLoading, refetch: refetchEqa } = useGetEqaAssignedLearnersQuery(
    {
      eqaId: eqaUserId,
      page: filters.page,
      page_size: filters.page_size,
      meta: true,
    },
    { skip: !isEqa || !user?.user_id }
  );

  const [deleteLearner, { isLoading: isDeleting }] = useDeleteLearnerMutation();

  // All roles now use server-side filtering and pagination
  const filteredLearners = useMemo<LearnerListItem[]>(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  // Transform EQA data to match table structure
  const eqaLearners = useMemo((): EqaLearnerItem[] => {
    if (!isEqa || !eqaData?.data) return [];
    return eqaData.data.map((item) => ({
      learner_id: item.learner_id?.learner_id || 0,
      first_name: item.learner_id?.first_name || "",
      last_name: item.learner_id?.last_name || "",
      user_name: item.learner_id?.user_name || "",
      email: item.learner_id?.email || "",
      mobile: "",
      course: [{
        user_course_id: item.user_course_id,
        course: {
          course_code: "",
          level: "",
          sector: "",
          recommended_minimum_age: "",
          total_credits: "",
          operational_start_date: "",
          guided_learning_hours: "",
          brand_guidelines: "",
          course_type: null,
          course_core_type: null,
          ...item.course,
        } as LearnerCourse["course"],
        start_date: item.start_date,
        end_date: item.end_date,
        course_status: item.course_status,
        is_main_course: false,
      }],
      status: item.course_status,
      // EQA-specific fields
      trainer_id: item.trainer_id,
      IQA_id: item.IQA_id,
      learner_created: item.learner_created || (item.learner_id?.created_at as string | undefined),
      course_registered: item.start_date,
      iqa_report: item.iqa_report,
    } as EqaLearnerItem));
  }, [isEqa, eqaData]);

  // Determine which data source to use
  const tableData: (LearnerListItem | EqaLearnerItem)[] = isEqa ? eqaLearners : filteredLearners;
  const isLoadingData = isEqa ? isEqaLoading : isLoading;
  const refetchData = isEqa ? refetchEqa : refetch;

  // Build status filter string from checkboxes (for server-side filtering)
  const statusFilterString = useMemo(() => {
    const selectedStatuses = Object.entries(statusFilters)
      .filter(([, checked]) => checked)
      .map(([status]) => status);
    return selectedStatuses.length > 0 ? selectedStatuses.join(", ") : "";
  }, [statusFilters]);

  // Update filters when any filter changes (all roles use server-side filtering, except EQA)
  useEffect(() => {
    if ((isAdmin || isEmployer || isTrainer) && !isEqa) {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        keyword: globalFilter || undefined,
        course_id: courseFilter && courseFilter !== "all" ? Number(courseFilter) : undefined,
        employer_id: isAdmin
          ? employerFilter && employerFilter !== "all"
            ? Number(employerFilter)
            : undefined
          : isEmployer && user?.user_id
          ? Number(user.user_id)
          : undefined, // For Employer, always use user.user_id
        status: statusFilterString || undefined,
      }));
    }
  }, [globalFilter, courseFilter, employerFilter, statusFilterString, isAdmin, isEmployer, isTrainer, isEqa, user?.user_id]);

  const handleSearch = useCallback(() => {
    if ((isAdmin || isEmployer || isTrainer) && !isEqa) {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        keyword: globalFilter || undefined,
        course_id: courseFilter && courseFilter !== "all" ? Number(courseFilter) : undefined,
        employer_id: isAdmin
          ? employerFilter && employerFilter !== "all"
            ? Number(employerFilter)
            : undefined
          : isEmployer && user?.user_id
          ? Number(user.user_id)
          : undefined, // For Employer, always use user.user_id
        status: statusFilterString || undefined,
      }));
    }
  }, [globalFilter, courseFilter, employerFilter, statusFilterString, isAdmin, isEmployer, isTrainer, isEqa, user?.user_id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setGlobalFilter("");
    setCourseFilter("all");
    setEmployerFilter("all");
    setStatusFilters(
      statusOptions.reduce((acc, status) => ({ ...acc, [status]: false }), {})
    );
    if ((isAdmin || isEmployer || isTrainer) && !isEqa) {
      setFilters((prev) => ({
        ...prev,
        page: 1,
        keyword: undefined,
        course_id: undefined,
        employer_id: isEmployer && user?.user_id ? Number(user.user_id) : undefined, // For Employer, keep employer_id
        status: undefined,
      }));
    }
  };

  const handleAddNew = () => {
    setEditingLearner(null);
    setIsFormOpen(true);
  };

  const handleEdit = (learner: LearnerListItem) => {
    setEditingLearner(learner);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (learner: LearnerListItem) => {
    setLearnerToDelete(learner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!learnerToDelete) return;

    try {
      await deleteLearner(learnerToDelete.learner_id).unwrap();
      toast.success("Learner deleted successfully");
      setDeleteDialogOpen(false);
      setLearnerToDelete(null);
      refetchData();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || "Failed to delete learner");
    }
  };

  const handleCommentClick = (learner: LearnerListItem) => {
    setLearnerForComment(learner);
    setCommentDialogOpen(true);
  };

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilters((prev) => ({ ...prev, [status]: checked }));
  };

  const handlePageChange = (page: number) => {
    // All roles now use server-side pagination
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    const exportData = isEqa ? eqaLearners : (data?.data || []);
    if (!exportData || exportData.length === 0) {
      toast.info("No data to export");
      return;
    }

    if (isEqa) {
      const headers = ["Learner Name", "Course", "Employer", "IQA", "Status", "IQA Report", "Learner Created", "Course Registered"];
      const rows = exportData.map((learner) => {
        const eqaLerner = learner as EqaLearnerItem;
        return [
          `${eqaLerner.first_name} ${eqaLerner.last_name}`,
          eqaLerner.course?.map((c) => c.course?.course_name).join(", ") || "",
          eqaLerner.employer_id?.employer_name || "-",
          eqaLerner.IQA_id ? `${eqaLerner.IQA_id.first_name} ${eqaLerner.IQA_id.last_name}` : "-",
          eqaLerner.status || "",
          eqaLerner.iqa_report || "-",
          formatDate(eqaLerner.learner_created),
          formatDate(eqaLerner.course_registered),
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learners_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } else {
      const headers = ["Learner Name", "Username", "Email", "Mobile", "Course", "Status"];
      const rows = exportData.map((learner) => [
        `${learner.first_name} ${learner.last_name}`,
        learner.user_name,
        learner.email,
        learner.mobile || "",
        learner.course?.map((c) => c.course.course_name).join(", ") || "",
        learner.status || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learners_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    }
  };

  const handleExportPdf = () => {
    const exportData = isEqa ? eqaLearners : (data?.data || []);
    if (!exportData || exportData.length === 0) {
      toast.info("No data to export");
      return;
    }
    if (isEqa) {
      const headers = ["Learner Name", "Course", "Employer", "IQA", "Status", "IQA Report", "Learner Created", "Course Registered"];
      const rows = exportData.map((learner) => {
        const eqaLerner = learner as LearnerListItem & { IQA_id?: { first_name: string; last_name: string }; learner_created?: string; course_registered?: string; iqa_report?: string };
        return [
          `${eqaLerner.first_name} ${eqaLerner.last_name}`,
          eqaLerner.course?.map((c) => c.course?.course_name).join(", ") || "",
          (learner as { employer_id?: { employer_name?: string } }).employer_id?.employer_name || "-",
          eqaLerner.IQA_id ? `${eqaLerner.IQA_id.first_name} ${eqaLerner.IQA_id.last_name}` : "-",
          eqaLerner.status || "",
          eqaLerner.iqa_report || "-",
          formatDate(eqaLerner.learner_created),
          formatDate(eqaLerner.course_registered),
        ];
      });
      exportTableToPdf({ title: "Learners", headers, rows });
    } else {
      const headers = ["Learner Name", "Username", "Email", "Mobile", "Course", "Status"];
      const rows = exportData.map((learner) => [
        `${learner.first_name} ${learner.last_name}`,
        learner.user_name,
        learner.email,
        learner.mobile || "",
        learner.course?.map((c) => c.course.course_name).join(", ") || "",
        learner.status || "",
      ]);
      exportTableToPdf({ title: "Learners", headers, rows });
    }
    toast.success("PDF exported successfully");
  };

  // Extended type for EQA learners
  type EqaLearnerItem = LearnerListItem & {
    IQA_id?: { first_name: string; last_name: string; [key: string]: unknown };
    trainer_id?: { first_name: string; last_name: string; [key: string]: unknown };
    iqa_report?: string;
    learner_created?: string;
    course_registered?: string;
  };

  const columns: ColumnDef<LearnerListItem | EqaLearnerItem>[] = useMemo(() => {
    // EQA-specific columns
    if (isEqa) {
      return [
        {
          accessorKey: "name",
          header: "Name",
          cell: ({ row }) => {
            const learner = row.original;
            const learnerName = `${learner.first_name} ${learner.last_name}`;
            return (
              <Link
                href={`/learner-profile?learner_id=${learner.learner_id}`}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                {learnerName}
              </Link>
            );
          },
        },
        {
          accessorKey: "course",
          header: "Course",
          cell: ({ row }) => {
            const learner = row.original;
            const courses = learner.course;
            if (!courses || courses.length === 0) return "-";
            return (
              <div className="flex items-center gap-1">
                {courses.map((c, index: number) => {
                  const courseName = c.course?.course_name || "Unknown Course";
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/learner-dashboard/${learner.learner_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center cursor-pointer"
                          >
                            <Folder className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{courseName}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/qa-sample-plan${c.course?.course_id ? `?course_id=${c.course.course_id}` : ''}`}
                            rel="noopener noreferrer"
                            className="flex items-center justify-center cursor-pointer"
                          >
                            <ClipboardList className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>QA Sample Plan</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            );
          },
        },
        {
          accessorKey: "trainer",
          header: "Trainer",
          cell: ({ row }) => {
            const learner = row.original;
            if (!isEqa || !('trainer_id' in learner)) return "-";
            const trainer = learner.trainer_id;
            if (!trainer) return "-";
            return `${trainer.first_name} ${trainer.last_name}`;
          },
        },
        {
          accessorKey: "iqa",
          header: "IQA",
          cell: ({ row }) => {
            const learner = row.original;
            if (!isEqa || !('IQA_id' in learner)) return "-";
            const iqa = learner.IQA_id;
            if (!iqa) return "-";
            return `${iqa.first_name} ${iqa.last_name}`;
          },
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => {
            const status = row.original.status;
            if (!status) return "-";
            return (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status === "Completed" || status === "Certificated"
                    ? "bg-green-100 text-green-800"
                    : status === "Early Leaver" || status === "Training Suspended"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                )}
              >
                {status}
              </span>
            );
          },
        },
        {
          accessorKey: "iqa_report",
          header: "IQA Report",
          cell: ({ row }) => {
            const learner = row.original;
            return (
              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`/iqa-report?course_id=${learner.course?.[0]?.course?.course_id}`}
                      rel="noopener noreferrer"
                      className="flex items-center cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View IQA Report</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          },
        },
        {
          accessorKey: "learner_created",
          header: "Learner Created",
          cell: ({ row }) => {
            const learner = row.original;
            if (!isEqa || !('learner_created' in learner)) return "-";
            return formatDate(learner.learner_created);
          },
        },
        {
          accessorKey: "course_registered",
          header: "Course Registered",
          cell: ({ row }) => {
            const learner = row.original;
            if (!isEqa || !('course_registered' in learner)) return "-";
            return formatDate(learner.course_registered);
          },
        },
      ];
    }

    // Default columns for Admin, Trainer, Employer
    return [
      {
        accessorKey: "name",
        header: "Learner Name",
        cell: ({ row }) => {
          const learner = row.original;
          const learnerName = `${learner.first_name} ${learner.last_name}`;
          const employerName = learner.employer_id?.employer_name;
          
          return (
            <div className="flex flex-col">
              <Link
                href={`/learner-profile?learner_id=${learner.learner_id}`}
                className="text-primary hover:underline cursor-pointer font-medium"
              >
                {learnerName}
              </Link>
              {isEmployer && employerName && (
                <span className="text-xs text-muted-foreground mt-0.5">
                  {employerName}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "user_name",
        header: "Username",
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
      },
      {
        accessorKey: "course",
        header: "Course",
        cell: ({ row }) => {
          const courses = row.original.course;
          if (!courses || courses.length === 0) return "-";
          return (
            <div className="flex items-center gap-1">
              {courses.map((c, index) => {
                const courseName = c.course?.course_name || "Unknown Course";
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center cursor-pointer">
                        <BookOpen className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{courseName}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ row }) => {
          const learner = row.original;
          const comment = learner.comment;
          return (
            <div className="flex items-center gap-2">
              {comment ? (
                <span className="max-w-[200px] truncate block" title={comment}>
                  {comment}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
              {!isEmployer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCommentClick(learner)}
                >
                  <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (!status) return "-";
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === "Completed" || status === "Certificated"
                  ? "bg-green-100 text-green-800"
                  : status === "Early Leaver" || status === "Training Suspended"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              )}
            >
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const learner = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin && (
                  <DropdownMenuItem onClick={() => handleEdit(learner)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canEditComments && (
                  <DropdownMenuItem onClick={() => handleCommentClick(learner)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(learner)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [canEditComments, isAdmin, isEmployer, isEqa]);

  // Determine table data - all roles now use server-side data
  // tableData is already defined above with conditional logic

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    manualPagination: true, // All roles now use server-side pagination
    pageCount: isEqa ? (eqaData?.meta_data?.pages || 0) : (data?.meta_data?.pages || 0),
  });

  if (isLoadingData) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="space-y-2 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Actions Bar */}
      <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by keyword..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          {!isEqa && (
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {isLoadingCourses ? (
                  <SelectItem value="loading" disabled>
                    Loading courses...
                  </SelectItem>
                ) : (
                  courseOptions.map((course) => (
                    <SelectItem key={course.course_id} value={String(course.course_id)}>
                      {course.course_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
          {/* Only show employer filter for Admin (not EQA) */}
          {isAdmin && !isEqa && (
            <Select value={employerFilter} onValueChange={setEmployerFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by employer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employers</SelectItem>
                {isLoadingEmployers ? (
                  <SelectItem value="loading" disabled>
                    Loading employers...
                  </SelectItem>
                ) : (
                  employerOptions.map((employer) => (
                    <SelectItem key={employer.employer_id} value={String(employer.employer_id)}>
                      {employer.employer_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
          {!isEqa && (globalFilter || courseFilter !== "all" || (isAdmin && employerFilter !== "all") || Object.values(statusFilters).some(Boolean)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="sm:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="flex flex-wrap justify-end items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Only show Upload and Add New for Admin (not Employer) */}
          {isAdmin && !isEmployer && (
            <>
              <Button variant="outline" onClick={() => setCsvUploadOpen(true)} className="cursor-pointer">
                <Upload className="mr-2 size-4" />
                Upload Learners
              </Button>
              <Button onClick={handleAddNew} className="cursor-pointer">
                <Plus className="mr-2 size-4" />
                Add New
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Filter Checkboxes - Hide for EQA */}
      {!isEqa && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status Filters</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {statusOptions.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={statusFilters[status] || false}
                  onCheckedChange={(checked) =>
                    handleStatusFilterChange(status, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`status-${status}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table or Card Layout based on role */}
      {isEmployer ? (
        /* Card-style layout for Employer */
        <div className="space-y-4">
          {tableData.length > 0 ? (
            tableData.map((learner) => (
              <EmployerLearnerRow
                key={learner.learner_id}
                learner={learner as LearnerListItem}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Learners Found</h3>
                <p className="text-muted-foreground">
                  No learners match your current filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Standard table layout for other roles */
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="min-w-[150px]">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination - All roles now use server-side pagination */}
      {((!isEqa && data?.meta_data) || (isEqa && eqaData?.meta_data)) && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={isEqa ? (eqaData?.meta_data?.page || 1) : (data?.meta_data?.page || 1)}
          totalPages={isEqa ? (eqaData?.meta_data?.pages || 0) : (data?.meta_data?.pages || 0)}
          totalItems={isEqa ? (eqaData?.meta_data?.total || 0) : (data?.meta_data?.items || 0)}
          pageSize={isEqa ? (eqaData?.meta_data?.page_size || 10) : (data?.meta_data?.page_size || 10)}
          onPageChange={handlePageChange}
          onPageSizeChange={(newPageSize) => {
            setFilters((prev) => ({
              ...prev,
              page: 1,
              page_size: newPageSize,
            }));
          }}
        />
      )}

      {/* Form Dialog - Only for Admin */}
      {isAdmin && (
        <LearnersFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          learner={editingLearner}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingLearner(null);
            refetchData();
          }}
        />
      )}

      {/* Comment Dialog */}
      {learnerForComment && (
        <LearnerCommentDialog
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          learner={learnerForComment}
          onSuccess={() => {
            setCommentDialogOpen(false);
            setLearnerForComment(null);
            refetchData();
          }}
        />
      )}

      {/* Delete Confirmation Dialog - Only for Admin */}
      {isAdmin && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the learner{" "}
                <strong>
                  {learnerToDelete?.first_name} {learnerToDelete?.last_name}
                </strong>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* CSV Upload Dialog - Only for Admin */}
      {isAdmin && (
        <LearnersCsvUploadDialog
          open={csvUploadOpen}
          onOpenChange={setCsvUploadOpen}
          onSuccess={() => {
            setCsvUploadOpen(false);
            refetchData();
          }}
        />
      )}
    </div>
  );
}

