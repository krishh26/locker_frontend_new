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
} from "@/store/api/learner/learnerApi";
import type { LearnerListItem, LearnerFilters } from "@/store/api/learner/types";
import { LearnersFormDialog } from "./learners-form-dialog";
import { LearnerCommentDialog } from "./learner-comment-dialog";
import { LearnersCsvUploadDialog } from "./learners-csv-upload-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

export function LearnersDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  console.log(user);
  const userRole = user?.role;
  const isAdmin = userRole === "Admin";
  const isTrainer = userRole === "Trainer";
  const isEmployer = userRole === "Employer";
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
        employer_id: filters.employer_id,
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
      return {
        ...baseFilters,
        employer_id: user?.user_id ? Number(user.user_id) : undefined,
      };
    }
    return baseFilters;
  }, [
    isAdmin,
    isTrainer,
    isEmployer,
    user?.id,
    user?.role,
    user?.user_id,
    filters.page,
    filters.page_size,
    filters.keyword,
    filters.course_id,
    filters.status,
    filters.employer_id,
  ]);

  // Single unified API query for all roles with meta=true (handled by API)
  const { data, isLoading, refetch } = useGetLearnersListQuery(unifiedFilters, {
    skip: (!isAdmin && !isTrainer && !isEmployer) || 
          (isTrainer && (!user?.id || !user?.role)) || 
          (isEmployer && !user?.user_id),
  });

  const [deleteLearner, { isLoading: isDeleting }] = useDeleteLearnerMutation();

  // All roles now use server-side filtering and pagination
  const filteredLearners = useMemo<LearnerListItem[]>(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  // Build status filter string from checkboxes (for server-side filtering)
  const statusFilterString = useMemo(() => {
    const selectedStatuses = Object.entries(statusFilters)
      .filter(([_, checked]) => checked)
      .map(([status]) => status);
    return selectedStatuses.length > 0 ? selectedStatuses.join(", ") : "";
  }, [statusFilters]);

  // Update filters when any filter changes (all roles use server-side filtering)
  useEffect(() => {
    if (isAdmin || isEmployer || isTrainer) {
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
  }, [globalFilter, courseFilter, employerFilter, statusFilterString, isAdmin, isEmployer, isTrainer, user?.user_id]);

  const handleSearch = useCallback(() => {
    if (isAdmin || isEmployer || isTrainer) {
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
  }, [globalFilter, courseFilter, employerFilter, statusFilterString, isAdmin, isEmployer, isTrainer, user?.user_id]);

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
    if (isAdmin || isEmployer || isTrainer) {
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
      refetch();
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
    // All roles now use server-side data
    const exportData = data?.data || [];
    if (!exportData || exportData.length === 0) {
      toast.info("No data to export");
      return;
    }

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
  };

  const handleExportPdf = () => {
    toast.info("PDF export functionality will be implemented");
  };

  const columns: ColumnDef<LearnerListItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Learner Name",
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCommentClick(learner)}
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
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
    ],
    [canEditComments, isAdmin]
  );

  // Determine table data - all roles now use server-side data
  const tableData = filteredLearners;

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
    pageCount: data?.meta_data?.pages || 0,
  });

  if (isLoading) {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {/* TODO: Add course options from API */}
            </SelectContent>
          </Select>
          {/* Only show employer filter for Admin */}
          {isAdmin && (
            <Select value={employerFilter} onValueChange={setEmployerFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by employer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employers</SelectItem>
                {/* TODO: Add employer options from API */}
              </SelectContent>
            </Select>
          )}
          {(globalFilter || courseFilter !== "all" || (isAdmin && employerFilter !== "all") || Object.values(statusFilters).some(Boolean)) && (
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
        <div className="flex items-center gap-2">
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
          {/* Only show Upload and Add New for Admin */}
          {isAdmin && (
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

      {/* Status Filter Checkboxes */}
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

      {/* Table */}
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

      {/* Pagination - All roles now use server-side pagination */}
      {data?.meta_data && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={data.meta_data.page}
          totalPages={data.meta_data.pages}
          totalItems={data.meta_data.items}
          pageSize={data.meta_data.page_size}
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
            refetch();
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
            refetch();
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
            refetch();
          }}
        />
      )}
    </div>
  );
}

