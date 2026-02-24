"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCourseType } from "@/store/slices/courseBuilderSlice";
import { exportTableToPdf } from "@/utils/pdfExport"
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

const courseTypes = [
  { value: "all", label: "All Types" },
  { value: "Qualification", label: "Qualification" },
  { value: "Standard", label: "Standard" },
  { value: "Gateway", label: "Gateway" },
];

const createCourseTypes = [
  { value: "Qualification", label: "Qualification", description: "Create a qualification course with units and criteria" },
  { value: "Standard", label: "Standard", description: "Create a standard course with modules and topics" },
  { value: "Gateway", label: "Gateway", description: "Create a gateway course for assessments" },
];

export function CourseBuilderDataTable() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isEmployer = userRole === "Employer";
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [courseTypeFilter, setCourseTypeFilter] = useState<string>("all");
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    page_size: 10,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [createCourseMenuOpen, setCreateCourseMenuOpen] = useState(false);

  const { data, isLoading } = useGetCoursesQuery(filters);
  const [deleteCourse,] = useDeleteCourseMutation();

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      keyword: globalFilter || undefined,
      core_type: courseTypeFilter && courseTypeFilter !== "all" ? courseTypeFilter : undefined,
    }));
  }, [globalFilter, courseTypeFilter]);

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
      toast.success("Course deleted successfully");
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (error: unknown) {
      const err = error as { status?: number; data?: { message?: string; error?: string } };
      if (isForbiddenError(err)) {
        toast.error(err?.data?.message ?? "You do not have access to delete this course.");
        return;
      }
      const errorMessage = err?.data?.message ?? err?.data?.error;
      toast.error(errorMessage || "Failed to delete course");
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleExportCsv = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info("No data to export");
      return;
    }

    const headers = ["Course Name", "Code", "Core Type", "Level", "Sector", "Learning Hours"];
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
    toast.success("CSV exported successfully");
  };

  const handleExportPdf = () => {
    if (!data?.data || data.data.length === 0) {
      toast.info("No data to export");
      return;
    }
    const headers = ["Course Name", "Code", "Core Type", "Level", "Sector", "Learning Hours"];
    const rows = data.data.map((course) => [
      course.course_name,
      course.course_code,
      course.course_core_type,
      course.level,
      course.sector,
      String(course.guided_learning_hours ?? ""),
    ]);
    exportTableToPdf({ title: "Courses", headers, rows });
    toast.success("PDF exported successfully");
  };

  const columns: ColumnDef<Course>[] = useMemo(
    () => [
      {
        accessorKey: "course_name",
        header: "Course Name",
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
        header: "Code",
      },
      {
        accessorKey: "course_core_type",
        header: "Core Type",
      },
      {
        accessorKey: "level",
        header: "Level",
      },
      {
        accessorKey: "sector",
        header: "Sector",
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
        header: "Learning Hours",
      },
      {
        id: "actions",
        header: "Actions",
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
                  View
                </DropdownMenuItem>
                {!isEmployer && (
                  <>
                    <DropdownMenuItem onClick={() => handleEdit(course)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(course)}
                      className="text-destructive"
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
    [handleEdit, handleView, isEmployer]
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
          <Select value={courseTypeFilter} onValueChange={handleCourseTypeChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Course Type" />
            </SelectTrigger>
            <SelectContent>
              {courseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(globalFilter || (courseTypeFilter && courseTypeFilter !== "all")) && (
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
        <div className="flex items-center flex-wrap justify-end gap-2">
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
          {!isEmployer && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
                className="cursor-pointer"
              >
                <Upload className="mr-2 size-4" />
                Upload File
              </Button>
              <DropdownMenu open={createCourseMenuOpen} onOpenChange={setCreateCourseMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button className="cursor-pointer">
                    <Plus className="mr-2 size-4" />
                    Create Course
                    <ChevronDown className="ml-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {createCourseTypes.map((type) => (
                <DropdownMenuItem
                  key={type.value}
                  onClick={() => handleCreateCourse(type.value)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
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

      {/* Upload Dialog */}
      <CourseUploadDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course{" "}
              <strong>{courseToDelete?.course_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

