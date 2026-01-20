"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search, X, ExternalLink } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSelector } from "@/store/hooks";
import {
  useGetResourcesByCourseQuery,
  useTrackResourceAccessMutation,
} from "@/store/api/resources/resourcesApi";
import { toast } from "sonner";
import type { CourseResource } from "@/store/api/resources/types";
import { DataTablePagination } from "@/components/data-table-pagination";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

export function CourseResourcesDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  const courses = useAppSelector((state) => state.auth.courses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const isEmployer = user?.role === "Employer";
  // Filter and validate courses that have the required structure
  const validCourses = useMemo(() => {
    return courses.filter(
      (course) => course?.course?.course_id != null
    );
  }, [courses]);

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    currentCourseId ? currentCourseId  : null
  );
  const [searchKeyword, setSearchKeyword] = useState("");
  const [jobType, setJobType] = useState<"On" | "Off" | "">("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [trackResourceAccess] = useTrackResourceAccessMutation();

  const { data, isLoading, refetch } = useGetResourcesByCourseQuery(
    {
      course_id: selectedCourseId || 0,
      user_id: user?.id || 0,
      search: searchKeyword,
      job_type: jobType,
    },
    {
      skip: !selectedCourseId || !user?.id,
    }
  );

  const resources = data?.data || [];

  const handleOpenResource = useCallback(
    async (url: string, resourceId: number | string) => {
      if (!user?.id) return;

      // Track access for learners
      if (user.role === "Learner") {
        try {
          await trackResourceAccess({
            resource_id: resourceId,
            user_id: user.id,
          }).unwrap();
          // Refetch to update the isAccessed status
          refetch();
        } catch (error) {
          console.error("Failed to track resource access:", error);
        }
      }

      // Open resource in new tab
      window.open(url, "_blank");
    },
    [user, trackResourceAccess, refetch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchKeyword("");
  }, []);

  const handleJobTypeToggle = useCallback((checked: boolean) => {
    setJobType(checked ? "On" : "Off");
  }, []);

  const columns: ColumnDef<CourseResource>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.getValue("description") as string | undefined;
          return (
            <div className="max-w-[300px] truncate">
              {description || "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "hours",
        header: "Hours",
        cell: ({ row }) => {
          const hours = row.getValue("hours") as number | string | undefined;
          return <div>{hours ?? "-"}</div>;
        },
      },
      {
        accessorKey: "minute",
        header: "Minutes",
        cell: ({ row }) => {
          const minute = row.getValue("minute") as number | string | undefined;
          return <div>{minute ?? "-"}</div>;
        },
      },
      {
        accessorKey: "job_type",
        header: "Job Type",
        cell: ({ row }) => {
          const jobType = row.getValue("job_type") as string | undefined;
          return <div>{jobType || "-"}</div>;
        },
      },
      {
        accessorKey: "isAccessed",
        header: "Access",
        cell: ({ row }) => {
          const isAccessed = row.getValue("isAccessed") as boolean | undefined;
          return (
            <div className="text-sm">
              {isAccessed ? (
                <span className="text-green-600">Opened</span>
              ) : (
                <span className="text-muted-foreground">Not Opened</span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const resource = row.original;
          const url = resource.url?.url;
          const isAccessed = resource.isAccessed;

          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (url && !isAccessed) {
                  handleOpenResource(url, resource.resource_id || resource.id);
                }
              }}
              disabled={!url || isAccessed}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [handleOpenResource]
  );

  const table = useReactTable({
    data: resources,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleExportCsv = () => {
    // TODO: Implement CSV export
    toast.info("CSV export functionality will be implemented");
  };

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    toast.info("PDF export functionality will be implemented");
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Course Selection */}
            {validCourses.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="course-select" className="whitespace-nowrap">
                  Course:
                </Label>
                <Select
                  value={selectedCourseId?.toString() || ""}
                  onValueChange={(value) => setSelectedCourseId(Number(value))}
                >
                  <SelectTrigger id="course-select" className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {validCourses.map((course) => (
                      <SelectItem
                        key={course.course.course_id}
                        value={course.course.course_id.toString()}
                      >
                        {course.course.course_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Search is handled automatically by the query
                  }
                }}
                className="pl-8 pr-8"
              />
              {searchKeyword && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={handleClearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Job Type Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={jobType === "On"}
                onCheckedChange={handleJobTypeToggle}
                id="job-type-switch"
              />
              <Label
                htmlFor="job-type-switch"
                className="text-sm whitespace-nowrap"
              >
                Job Type: {jobType || "On/Off"}
              </Label>
            </div>

            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                {selectedCourseId
                  ? "No resources found for this course."
                  : "Please select a course to view resources."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
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
              <div className="mt-4">
                <DataTablePagination table={table} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

