"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, ChevronDown, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  useGetTimeLogsQuery,
  useGetTimeLogSpendQuery,
  useUpdateTimeLogMutation,
  useDeleteTimeLogMutation,
} from "@/store/api/time-log/timeLogApi";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { selectCourses } from "@/store/slices/authSlice";
import type { TimeLogEntry } from "@/store/api/time-log/types";
import { TimeLogSummaryCards } from "./time-log-summary-cards";
import { RecentActivitySection } from "./recent-activity-section";
import { TimeLogFormDialog } from "./time-log-form-dialog";
import { OffTheJobSummary } from "./off-the-job-summary";

export function TimeLogDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  const courses = useAppSelector(selectCourses);
  const userId = user?.id || "";
  const isEmployer = user?.role === "Employer";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("All");
  const [approvedFilter, setApprovedFilter] = useState<string>("All");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTimeLog, setSelectedTimeLog] = useState<TimeLogEntry | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const {
    data: timeLogsResponse,
    isLoading,
    refetch,
  } = useGetTimeLogsQuery({
    page,
    page_size: pageSize,
    user_id: userId,
    course_id: courseFilter || undefined,
    type: jobTypeFilter !== "All" ? jobTypeFilter : undefined,
    approved: approvedFilter !== "All" ? approvedFilter : undefined,
  });

  const { data: spendResponse } = useGetTimeLogSpendQuery({
    user_id: userId,
    course_id: courseFilter || undefined,
    type: jobTypeFilter !== "All" ? jobTypeFilter : undefined,
  });

  const [updateTimeLog] = useUpdateTimeLogMutation();
  const [deleteTimeLog] = useDeleteTimeLogMutation();

  const timeLogs = useMemo(() => timeLogsResponse?.data ?? [], [timeLogsResponse?.data]);
  const metaData = timeLogsResponse?.meta_data;
  
  // Get latest 3 time logs for recent activities
  const recentActivities = useMemo(() => {
    return timeLogs
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.activity_date).getTime();
        const dateB = new Date(b.activity_date).getTime();
        return dateB - dateA; // Sort descending (newest first)
      })
      .slice(0, 3)
      .map((log) => ({
        activity_type: log.activity_type || "",
        type: log.type || "",
        spend_time: log.spend_time || "",
        activity_date: log.activity_date || "",
      }));
  }, [timeLogs]);

  const spendData = spendResponse?.data;

  const handleDelete = useCallback(async () => {
    if (!selectedTimeLog?.id) return;

    try {
      await deleteTimeLog(selectedTimeLog.id).unwrap();
      toast.success("Time log deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedTimeLog(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || "Failed to delete time log");
    }
  }, [deleteTimeLog, selectedTimeLog, refetch]);

  const handleEdit = useCallback((timeLog: TimeLogEntry) => {
    setSelectedTimeLog(timeLog);
    setEditMode(true);
    setFormDialogOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedTimeLog(null);
    setEditMode(false);
    setFormDialogOpen(true);
  }, []);

  const handleVerifyChange = useCallback(
    async (checked: boolean, timeLog: TimeLogEntry) => {
      if (!timeLog.id) return;

      try {
        await updateTimeLog({
          id: timeLog.id,
          verified: checked,
        }).unwrap();
        toast.success(
          checked ? "Time log approved" : "Time log approval removed"
        );
        refetch();
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { error?: string } }).data?.error
            : undefined;
        toast.error(errorMessage || "Failed to update time log");
      }
    },
    [updateTimeLog, refetch]
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString?.substring(0, 10) || "-";
    }
  };

  const getJobTypeBadgeProps = (type: string | undefined) => {
    if (!type) return { variant: "default" as const, className: "" };
    const lowerType = type.toLowerCase();
    if (lowerType.includes("off"))
      return {
        variant: "outline" as const,
        className: "bg-secondary text-white border-secondary",
      };
    if (lowerType.includes("on"))
      return {
        variant: "default" as const,
        className: "bg-accent text-white border-accent",
      };
    return { variant: "default" as const, className: "" };
  };

  const columns: ColumnDef<TimeLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: "activity_type",
        header: "Activity Type",
        cell: ({ row }) => {
          return (
            <span className="font-medium">
              {row.getValue("activity_type") || "-"}
            </span>
          );
        },
      },
      {
        id: "course_unit",
        header: "Course / Unit",
        cell: ({ row }) => {
          const course = row.original.course_id;
          const courseName =
            typeof course === "object" && course
              ? course.course_name
              : course || "-";
          return <span className="text-sm">{courseName}</span>;
        },
      },
      {
        id: "trainer",
        header: "Trainer",
        cell: ({ row }) => {
          const trainer = row.original.trainer_id;
          const trainerName =
            typeof trainer === "object" && trainer
              ? trainer.user_name
              : trainer || "-";
          return <span className="text-sm">{trainerName}</span>;
        },
      },
      {
        accessorKey: "spend_time",
        header: "Time Spent",
        cell: ({ row }) => {
          return (
            <span className="font-medium">
              {row.getValue("spend_time") || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "start_time",
        header: "Activity Start Time",
        cell: ({ row }) => {
          return <span className="text-sm">{row.getValue("start_time") || "-"}</span>;
        },
      },
      {
        accessorKey: "type",
        header: "On/Off the Job Training",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          if (!type) return <span>-</span>;
          const badgeProps = getJobTypeBadgeProps(type);
          return (
            <Badge variant={badgeProps.variant} className={badgeProps.className}>
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "verified",
        header: "Approved",
        cell: ({ row }) => {
          const timeLog = row.original;
          const isTrainer = user?.role === "Trainer";
          const isCurrentUserTrainer =
            typeof timeLog.trainer_id === "object" &&
            timeLog.trainer_id?.user_id === userId;

          if (isTrainer && isCurrentUserTrainer) {
            return (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={timeLog.verified || false}
                  onCheckedChange={(checked) =>
                    handleVerifyChange(checked as boolean, timeLog)
                  }
                />
                <span className="text-sm">Assessor</span>
              </div>
            );
          }

          return (
            <span className="text-sm">
              {timeLog.verified ? "Approved" : "Not Approved"}
            </span>
          );
        },
      },
      {
        accessorKey: "impact_on_learner",
        header: "Comment",
        cell: ({ row }) => {
          const comment = row.getValue("impact_on_learner") as string;
          return (
            <span className="text-sm max-w-md truncate block">
              {comment || "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "activity_date",
        header: "Date",
        cell: ({ row }) => {
          const date = row.getValue("activity_date") as string;
          return <span className="text-sm">{formatDate(date)}</span>;
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const timeLog = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isEmployer && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => handleEdit(timeLog)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {!isEmployer && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer text-destructive"
                      onClick={() => {
                        setSelectedTimeLog(timeLog);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [user?.role, userId, isEmployer, handleVerifyChange, handleEdit]
  );

  const table = useReactTable({
    data: timeLogs,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
    },
    manualPagination: true,
    pageCount: metaData?.pages ?? 0,
  });

  useEffect(() => {
    setPage(1);
  }, [courseFilter, jobTypeFilter, approvedFilter]);

  if (isLoading && !timeLogs.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading time logs...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course-filter" className="text-sm font-medium">
            Select Course
          </Label>
          <Select value={courseFilter || "all"} onValueChange={(value) => setCourseFilter(value === "all" ? "" : value)}>
            <SelectTrigger id="course-filter" className="cursor-pointer">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((learnerCourse,index) => (
                <SelectItem
                  key={index}
                  value={String(learnerCourse.course.course_id)}
                >
                  {learnerCourse.course.course_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-type-filter" className="text-sm font-medium">
            Select Job Training
          </Label>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger id="job-type-filter" className="cursor-pointer">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Not Applicable">Not Applicable</SelectItem>
              <SelectItem value="On the job">On the job</SelectItem>
              <SelectItem value="Off the job">Off the job</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approved-filter" className="text-sm font-medium">
            Assessor Approved
          </Label>
          <Select value={approvedFilter} onValueChange={setApprovedFilter}>
            <SelectTrigger id="approved-filter" className="cursor-pointer">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="true">Approved</SelectItem>
              <SelectItem value="false">Not Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <TimeLogSummaryCards
        thisWeek={spendData?.thisWeek}
        thisMonth={spendData?.thisMonth}
        total={spendData?.total}
      />

      {/* Off the Job Summary Section */}
      <OffTheJobSummary courseId={courseFilter || null} />

      {/* Recent Activity Section */}
      <RecentActivitySection activities={recentActivities} />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {!isEmployer && (
          <Button onClick={handleAdd} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add New Timelog Entry
          </Button>
        )}
        <div className="space-y-2">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            Column Visibility
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer">
                Columns <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                  No time log entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {metaData && (
        <DataTablePagination
          table={table}
          manualPagination={true}
          currentPage={page}
          totalPages={metaData.pages}
          totalItems={metaData.items}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          }}
        />
      )}

      {/* Delete Dialog */}
      {!isEmployer && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Log?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this time log will also remove all associated data and
              relationships. Proceed with deletion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Time Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Form Dialog */}
      {!isEmployer && (
        <TimeLogFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          timeLog={selectedTimeLog}
          editMode={editMode}
          onSuccess={() => {
            refetch();
            setFormDialogOpen(false);
            setSelectedTimeLog(null);
          }}
        />
      )}
    </div>
  );
}
