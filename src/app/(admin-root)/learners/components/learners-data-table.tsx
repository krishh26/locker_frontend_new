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
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const canEditComments = userRole === "Admin" || userRole === "Trainer";

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

  const { data, isLoading, refetch } = useGetLearnersListQuery(filters);
  const [deleteLearner, { isLoading: isDeleting }] = useDeleteLearnerMutation();

  // Build status filter string from checkboxes
  const statusFilterString = useMemo(() => {
    const selectedStatuses = Object.entries(statusFilters)
      .filter(([_, checked]) => checked)
      .map(([status]) => status);
    return selectedStatuses.length > 0 ? selectedStatuses.join(", ") : "";
  }, [statusFilters]);

  // Update filters when any filter changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: globalFilter || undefined,
      course_id: courseFilter && courseFilter !== "all" ? Number(courseFilter) : undefined,
      employer_id: employerFilter && employerFilter !== "all" ? Number(employerFilter) : undefined,
      status: statusFilterString || undefined,
    }));
  }, [globalFilter, courseFilter, employerFilter, statusFilterString]);

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: globalFilter || undefined,
      course_id: courseFilter && courseFilter !== "all" ? Number(courseFilter) : undefined,
      employer_id: employerFilter && employerFilter !== "all" ? Number(employerFilter) : undefined,
      status: statusFilterString || undefined,
    }));
  }, [globalFilter, courseFilter, employerFilter, statusFilterString]);

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
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: undefined,
      course_id: undefined,
      employer_id: undefined,
      status: undefined,
    }));
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
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = ["Learner Name", "Username", "Email", "Mobile", "Course", "Status"];
    const rows = data.data.map((learner) => [
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
          return `${learner.first_name} ${learner.last_name}`;
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
          return courses.map((c) => c.course.course_name).join(", ");
        },
      },
      {
        accessorKey: "comment",
        header: "Comment",
        cell: ({ row }) => {
          const comment = row.original.comment;
          if (!comment) return "-";
          return (
            <span className="max-w-[200px] truncate block" title={comment}>
              {comment}
            </span>
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
                <DropdownMenuItem onClick={() => handleEdit(learner)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {canEditComments && (
                  <DropdownMenuItem onClick={() => handleCommentClick(learner)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Comment
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(learner)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canEditComments]
  );

  const table = useReactTable({
    data: data?.data || [],
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
    manualPagination: true,
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
          <Select value={employerFilter} onValueChange={setEmployerFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by employer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employers</SelectItem>
              {/* TODO: Add employer options from API */}
            </SelectContent>
          </Select>
          {(globalFilter || courseFilter !== "all" || employerFilter !== "all" || Object.values(statusFilters).some(Boolean)) && (
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
          <Button variant="outline" onClick={() => setCsvUploadOpen(true)} className="cursor-pointer">
            <Upload className="mr-2 size-4" />
            Upload Learners
          </Button>
          <Button onClick={handleAddNew} className="cursor-pointer">
            <Plus className="mr-2 size-4" />
            Add New
          </Button>
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

      {/* Pagination */}
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

      {/* Form Dialog */}
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

      {/* Delete Confirmation Dialog */}
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

      {/* CSV Upload Dialog */}
      <LearnersCsvUploadDialog
        open={csvUploadOpen}
        onOpenChange={setCsvUploadOpen}
        onSuccess={() => {
          setCsvUploadOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

