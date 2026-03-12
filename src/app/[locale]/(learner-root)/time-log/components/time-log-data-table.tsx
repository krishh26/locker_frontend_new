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
import { useTranslations } from "next-intl";

export function TimeLogDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  const courses = useAppSelector(selectCourses);
  const userId = user?.id || "";
  const isEmployer = user?.role === "Employer";
  const t = useTranslations("timeLog");

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
      toast.success(t("toast.deleteSuccess"));
      setDeleteDialogOpen(false);
      setSelectedTimeLog(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: string } }).data?.error
          : undefined;
      toast.error(errorMessage || t("toast.deleteFailed"));
    }
  }, [deleteTimeLog, selectedTimeLog, refetch, t]);

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
          checked
            ? t("toast.updateSuccess")
            : t("toast.updateSuccess")
        );
        refetch();
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === "object" && "data" in error
            ? (error as { data?: { error?: string } }).data?.error
            : undefined;
        toast.error(errorMessage || t("toast.updateFailed"));
      }
    },
    [updateTimeLog, refetch, t]
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
        header: t("table.columns.activityType"),
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
        header: t("table.columns.courseUnit"),
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
        header: t("table.columns.trainer"),
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
        header: t("table.columns.timeSpent"),
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
        header: t("table.columns.startTime"),
        cell: ({ row }) => {
          return <span className="text-sm">{row.getValue("start_time") || "-"}</span>;
        },
      },
      {
        accessorKey: "type",
        header: t("table.columns.onOffJob"),
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
        header: t("table.columns.approved"),
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
                <span className="text-sm">
                  {t("table.labels.assessor")}
                </span>
              </div>
            );
          }

          return (
            <span className="text-sm">
              {timeLog.verified
                ? t("table.labels.approved")
                : t("table.labels.notApproved")}
            </span>
          );
        },
      },
      {
        accessorKey: "impact_on_learner",
        header: t("table.columns.comment"),
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
        header: t("table.columns.date"),
        cell: ({ row }) => {
          const date = row.getValue("activity_date") as string;
          return <span className="text-sm">{formatDate(date)}</span>;
        },
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
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
                    {t("common.edit", { default: "Edit" })}
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
                      {t("dialog.delete.buttons.confirm")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [user?.role, userId, isEmployer, handleVerifyChange, handleEdit, t]
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
        <div className="text-muted-foreground">{t("table.loading")}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course-filter" className="text-sm font-medium">
            {t("filters.course.label")}
          </Label>
          <Select value={courseFilter || "all"} onValueChange={(value) => setCourseFilter(value === "all" ? "" : value)}>
            <SelectTrigger id="course-filter" className="cursor-pointer">
              <SelectValue placeholder={t("filters.course.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.course.all")}</SelectItem>
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
            {t("filters.jobType.label")}
          </Label>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger id="job-type-filter" className="cursor-pointer">
              <SelectValue placeholder={t("filters.jobType.options.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t("filters.jobType.options.all")}</SelectItem>
              <SelectItem value="Not Applicable">
                {t("filters.jobType.options.notApplicable")}
              </SelectItem>
              <SelectItem value="On the job">
                {t("filters.jobType.options.onTheJob")}
              </SelectItem>
              <SelectItem value="Off the job">
                {t("filters.jobType.options.offTheJob")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="approved-filter" className="text-sm font-medium">
            {t("filters.approved.label")}
          </Label>
          <Select value={approvedFilter} onValueChange={setApprovedFilter}>
            <SelectTrigger id="approved-filter" className="cursor-pointer">
              <SelectValue placeholder={t("filters.approved.options.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">
                {t("filters.approved.options.all")}
              </SelectItem>
              <SelectItem value="true">
                {t("filters.approved.options.approved")}
              </SelectItem>
              <SelectItem value="false">
                {t("filters.approved.options.notApproved")}
              </SelectItem>
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
            {t("actions.addButton")}
          </Button>
        )}
        <div className="space-y-2">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            {t("actions.columnVisibilityLabel")}
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer">
                {t("actions.columnsButton")}{" "}
                <ChevronDown className="ml-2 size-4" />
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
                  {t("table.empty")}
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
            <AlertDialogTitle>{t("dialog.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              {t("dialog.delete.buttons.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dialog.delete.buttons.confirm")}
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
