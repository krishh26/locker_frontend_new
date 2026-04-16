"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCourseType } from "@/store/slices/courseBuilderSlice";
import { exportTableToPdf } from "@/utils/pdfExport";
import { useGetCoursesQuery, useDeleteCourseMutation } from "@/store/api/course/courseApi";
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
  Upload,
  Eye,
  ChevronDown,
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
import type { Course, CourseFilters } from "@/store/api/course/types";
import { isForbiddenError } from "@/store/api/baseQuery";
import { CourseUploadDialog } from "./course-upload-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useTranslations } from "next-intl";
import { isMasterAdmin } from "@/utils/permissions";

const courseTypes = ["all", "Qualification", "Standard", "Gateway"] as const;

const createCourseTypes = ["Qualification", "Standard", "Gateway"] as const;

export function CourseBuilderDataTable() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isEmployer = userRole === "Employer";
  const showScopeFilter = !isMasterAdmin(user);
  const t = useTranslations("courseBuilder");
  const tCommon = useTranslations("common");
  const tAdmin = useTranslations("adminCommon");
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<CourseFilters["scope"]>("organisation");
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    page_size: 10,
    scope: "organisation",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [createCourseMenuOpen, setCreateCourseMenuOpen] = useState(false);

  const { data, isLoading } = useGetCoursesQuery(filters, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteCourse,] = useDeleteCourseMutation();

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: globalFilter || undefined,
      core_type: courseTypeFilter && courseTypeFilter !== "all" ? courseTypeFilter : undefined,
      scope: showScopeFilter ? scopeFilter : prev.scope,
    }));
  }, [globalFilter, courseTypeFilter, scopeFilter, showScopeFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setGlobalFilter("");
    setCourseTypeFilter("all");
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: undefined,
      core_type: undefined,
      scope: "organisation",
    }));
  };

  const handleCourseTypeChange = (value: string) => {
    setCourseTypeFilter(value);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      core_type: value && value !== "all" ? value : undefined,
    }));
  };

  const handleScopeChange = (value: string) => {
    const nextScope: CourseFilters["scope"] =
      value === "global" ? "global" : "organisation";
    setScopeFilter(nextScope);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      scope: nextScope,
    }));
  };

  const handleCreateCourse = (courseCoreType: string) => {
    dispatch(setCourseType(courseCoreType));
    router.push("/course-builder/course");
    setCreateCourseMenuOpen(false);
  };

  const handleEdit = useCallback((course: Course) => {
    router.push(`/course-builder/course?id=${course.course_id}`);
  }, [router]);

  const handleView = useCallback((course: Course) => {
    router.push(`/course-builder/course?id=${course.course_id}&view=true`);
  }, [router]);

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    try {
      await deleteCourse(courseToDelete.course_id).unwrap();
      toast.success(t("toast.deleteSuccess"));
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { message?: string; error?: string } };
      if (isForbiddenError(err)) {
        toast.error(err?.data?.message ?? t("toast.forbiddenDelete"));
        return;
      }
      const errorMessage = err?.data?.message ?? err?.data?.error;
      toast.error(errorMessage || t("toast.deleteFailed"));
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info(tAdmin("noDataToExport"));
      return;
    }

    const headers = [
      t("table.headers.courseName"),
      t("table.headers.code"),
      t("table.headers.coreType"),
      t("table.headers.level"),
      t("table.headers.sector"),
      t("table.headers.learningHours"),
    ];
    const rows = data.data.map((course) => [
      course.course_name,
      course.course_code,
      course.course_core_type,
      course.level,
      course.sector,
      course.guided_learning_hours,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `courses_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(tAdmin("csvExported"));
  };

  const handleExportPdf = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info(tAdmin("noDataToExport"));
      return;
    }
    const headers = [
      t("table.headers.courseName"),
      t("table.headers.code"),
      t("table.headers.coreType"),
      t("table.headers.level"),
      t("table.headers.sector"),
      t("table.headers.learningHours"),
    ];
    const rows = data.data.map((course) => [
      course.course_name,
      course.course_code,
      course.course_core_type,
      course.level,
      course.sector,
      String(course.guided_learning_hours ?? ""),
    ]);
    void exportTableToPdf({ title: t("export.pdfTitle"), headers, rows });
    toast.success(t("export.pdfExported"));
  };

  const columns: ColumnDef<Course>[] = useMemo(
    () => [
      {
        accessorKey: "course_name",
        header: t("table.headers.courseName"),
        cell: ({ row }) => {
          const name = row.original.course_name;
          return (
            <div className="max-w-[200px] truncate" title={name}>
              {name}
            </div>
          );
        },
      },
      {
        accessorKey: "course_code",
        header: t("table.headers.code"),
      },
      {
        accessorKey: "course_core_type",
        header: t("table.headers.coreType"),
      },
      {
        accessorKey: "level",
        header: t("table.headers.level"),
      },
      {
        accessorKey: "sector",
        header: t("table.headers.sector"),
        cell: ({ row }) => {
          const sector = row.original.sector;
          return (
            <div className="max-w-[150px] truncate" title={sector}>
              {sector}
            </div>
          );
        },
      },
      {
        accessorKey: "guided_learning_hours",
        header: t("table.headers.learningHours"),
      },
      {
        id: "actions",
        header: tAdmin("actions"),
        cell: ({ row }) => {
          const course = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleView(course)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("table.actions.view")}
                </DropdownMenuItem>
                {!isEmployer && (
                  <>
                    <DropdownMenuItem onClick={() => handleEdit(course)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {tCommon("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(course)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon("delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEdit, handleView, isEmployer, t, tCommon, tAdmin]
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
              placeholder={t("filters.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Select value={courseTypeFilter} onValueChange={handleCourseTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t("filters.courseTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {courseTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`filters.courseTypes.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showScopeFilter && (
            <Select value={scopeFilter} onValueChange={handleScopeChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={t("filters.scopePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organisation">
                  {t("filters.scopeTypes.organisation")}
                </SelectItem>
                <SelectItem value="global">
                  {t("filters.scopeTypes.global")}
                </SelectItem>
              </SelectContent>
            </Select>
          )}
          {(globalFilter ||
            (courseTypeFilter && courseTypeFilter !== "all") ||
            (showScopeFilter && scopeFilter !== "organisation")) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="sm:w-auto"
            >
              {tAdmin("clear")}
            </Button>
          )}
        </div>
        <div className="flex items-center flex-wrap justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Download className="mr-2 size-4" />
                {tAdmin("export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
                {tAdmin("exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
                {tAdmin("exportPdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isEmployer && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="mr-2 size-4" />
                {t("upload.button")}
              </Button>
              <DropdownMenu open={createCourseMenuOpen} onOpenChange={setCreateCourseMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button className="cursor-pointer">
                    <Plus className="mr-2 size-4" />
                    {t("create.button")}
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {createCourseTypes.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleCreateCourse(type)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {t(`create.types.${type}.label`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(`create.types.${type}.description`)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          )}
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
                  {tAdmin("noResults")}
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

      {/* Upload Dialog */}
      <CourseUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", {
                name: courseToDelete?.course_name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

