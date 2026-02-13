"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useGetLearnerPlanListQuery } from "@/store/api/learner-plan/learnerPlanApi";
import type { LearningPlanSession } from "@/store/api/learner-plan/types";
import { useCachedUsersByRole } from "@/store/hooks/useCachedUsersByRole";
import { useDebounce } from "@/hooks/use-debounce";
import {
  exportGatewayReportToCSV,
  downloadCSV,
  generateGatewayReportFilename,
} from "../utils/csv-export";
import { toast } from "sonner";
import type { User } from "@/store/api/user/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface GatewayData {
  learner_first_name: string;
  learner_last_name: string;
  learner_uln: string;
  course_name: string;
  trainer_name: string;
  session_book_date: string;
  gateway_progress: number;
  assessor_id?: number | null;
}

interface FilterState {
  assessor: string;
}

const DEFAULT_FILTER_VALUE = "all";

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

// Transform learner plan data to gateway data format
const transformLearnerPlanData = (learnerPlanData: LearningPlanSession[]): GatewayData[] => {
  const transformedData: GatewayData[] = [];

  learnerPlanData?.forEach((plan) => {
    // Get course names from the plan
    const courseNames =
      plan.courses?.map((course) => course.course_name).join(", ") || "-";

    // Get trainer name from assessor_id
    let trainerName = "-";
    if (plan.assessor_id) {
      const trainerFirstName = plan.assessor_id.first_name || "";
      const trainerLastName = plan.assessor_id.last_name || "";

      if (trainerFirstName || trainerLastName) {
        trainerName = `${trainerFirstName} ${trainerLastName}`.trim();
      } else if (plan.assessor_id.user_name) {
        trainerName = plan.assessor_id.user_name;
      }
    }

    plan.learners?.forEach((learner) => {
      // Use first_name and last_name directly from learner object
      let firstName = learner.first_name || "";
      let lastName = learner.last_name || "";

      // Parse user_name as fallback if first_name and last_name are not available
      if (!firstName && !lastName && learner.user_name) {
        const nameParts = learner.user_name.split("_");
        firstName = nameParts[0] || "";
        lastName = nameParts[1] || "";
      }

      transformedData.push({
        learner_first_name: firstName || "-",
        learner_last_name: lastName || "-",
        learner_uln: (learner as { uln?: string }).uln || "-",
        course_name: courseNames,
        trainer_name: trainerName,
        session_book_date: plan.startDate || "",
        gateway_progress: 0, // This would come from actual progress data
        assessor_id: plan.assessor_id?.user_id || null,
      });
    });
  });

  return transformedData;
};

export function GatewayReportDataTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    assessor: DEFAULT_FILTER_VALUE,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const debouncedSearch = useDebounce(searchKeyword, 500);

  // Fetch dropdown data
  const { data: trainerUsers, isLoading: loadingTrainers } = useCachedUsersByRole("Trainer");

  // Transform API data for dropdowns
  const trainers =
    trainerUsers?.data?.map((user: User) => ({
      id: user.user_id?.toString() || "",
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.user_name || "Unknown",
    })) || [];

  // API query - For Gateway Ready, we fetch all plans with type "Gateway Ready"
  // The API filters out empty/null values, so we can pass learners as empty string or "all"
  const {
    data: learnerPlanData,
    isLoading,
    error,
  } = useGetLearnerPlanListQuery({
    learners: "", // Empty string will be filtered out by the API query builder
    type: "Gateway Ready",
    meta: true,
  });

  // Transform and filter data
  const allGatewayData = useMemo(() => {
    if (!learnerPlanData?.data) return [];
    return transformLearnerPlanData(learnerPlanData.data);
  }, [learnerPlanData]);

  // Apply frontend filtering
  const filteredData = useMemo(() => {
    return allGatewayData.filter((row) => {
      // Filter by assessor/trainer
      if (filters.assessor && filters.assessor !== DEFAULT_FILTER_VALUE) {
        if (row.assessor_id !== Number(filters.assessor)) {
          return false;
        }
      }

      // Filter by search keyword
      if (debouncedSearch) {
        const keyword = debouncedSearch.toLowerCase();
        const matchesFirstName = row.learner_first_name.toLowerCase().includes(keyword);
        const matchesLastName = row.learner_last_name.toLowerCase().includes(keyword);
        const matchesULN = row.learner_uln.toLowerCase().includes(keyword);
        const matchesCourseName = row.course_name.toLowerCase().includes(keyword);
        const matchesTrainerName = row.trainer_name.toLowerCase().includes(keyword);

        if (
          !matchesFirstName &&
          !matchesLastName &&
          !matchesULN &&
          !matchesCourseName &&
          !matchesTrainerName
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allGatewayData, filters, debouncedSearch]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;

    const sorted = [...filteredData];
    sorting.forEach((sort) => {
      sorted.sort((a, b) => {
        const aValue = a[sort.id as keyof GatewayData];
        const bValue = b[sort.id as keyof GatewayData];

        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sort.desc ? -comparison : comparison;
      });
    });

    return sorted;
  }, [filteredData, sorting]);

  // Apply pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      assessor: DEFAULT_FILTER_VALUE,
    });
    setSearchKeyword("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };


  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      const csvContent = exportGatewayReportToCSV(filteredData);
      const filename = generateGatewayReportFilename();
      downloadCSV(csvContent, filename);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  const columns: ColumnDef<GatewayData>[] = useMemo(
    () => [
      {
        accessorKey: "learner_first_name",
        header: () => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const sort = sorting.find((s) => s.id === "learner_first_name");
                if (sort) {
                  if (sort.desc) {
                    setSorting((prev) => prev.filter((s) => s.id !== "learner_first_name"));
                  } else {
                    setSorting((prev) =>
                      prev.map((s) => (s.id === "learner_first_name" ? { ...s, desc: true } : s))
                    );
                  }
                } else {
                  setSorting((prev) => [...prev, { id: "learner_first_name", desc: false }]);
                }
              }}
              className="h-8 px-2 hover:bg-transparent"
            >
              Learner First Name
              {(() => {
                const sort = sorting.find((s) => s.id === "learner_first_name");
                if (!sort) return <ArrowUpDown className="ml-2 h-4 w-4" />;
                return sort.desc ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUp className="ml-2 h-4 w-4" />
                );
              })()}
            </Button>
          );
        },
        cell: ({ row }) => row.original.learner_first_name,
      },
      {
        accessorKey: "learner_last_name",
        header: () => {
          return (
            <Button
              variant="ghost"
              onClick={() => {
                const sort = sorting.find((s) => s.id === "learner_last_name");
                if (sort) {
                  if (sort.desc) {
                    setSorting((prev) => prev.filter((s) => s.id !== "learner_last_name"));
                  } else {
                    setSorting((prev) =>
                      prev.map((s) => (s.id === "learner_last_name" ? { ...s, desc: true } : s))
                    );
                  }
                } else {
                  setSorting((prev) => [...prev, { id: "learner_last_name", desc: false }]);
                }
              }}
              className="h-8 px-2 hover:bg-transparent"
            >
              Learner Last Name
              {(() => {
                const sort = sorting.find((s) => s.id === "learner_last_name");
                if (!sort) return <ArrowUpDown className="ml-2 h-4 w-4" />;
                return sort.desc ? (
                  <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                  <ArrowUp className="ml-2 h-4 w-4" />
                );
              })()}
            </Button>
          );
        },
        cell: ({ row }) => row.original.learner_last_name,
      },
      {
        accessorKey: "learner_uln",
        header: "Learner ULN",
        cell: ({ row }) => row.original.learner_uln,
      },
      {
        accessorKey: "course_name",
        header: "Course Name",
        cell: ({ row }) => (
          <Badge variant="outline" className="max-w-[200px] truncate">
            {row.original.course_name}
          </Badge>
        ),
      },
      {
        accessorKey: "trainer_name",
        header: "Trainer Name",
        cell: ({ row }) => row.original.trainer_name,
      },
      {
        accessorKey: "session_book_date",
        header: "Session Book Date",
        cell: ({ row }) => formatDate(row.original.session_book_date),
      },
      {
        accessorKey: "gateway_progress",
        header: "Gateway Progress %",
        cell: ({ row }) => {
          const progress = row.original.gateway_progress;

          return (
            <div className="flex items-center gap-2 min-w-[150px]">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    progress >= 80
                      ? "bg-accent"
                      : progress >= 60
                      ? "bg-secondary"
                      : "bg-destructive"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-semibold min-w-[35px]">{progress}%</span>
            </div>
          );
        },
      },
    ],
    [sorting]
  );

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gateway Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2 w-full sm:w-auto sm:min-w-[200px]">
            <label className="text-sm font-medium">Select Trainer</label>
            <Select
              value={filters.assessor}
              onValueChange={(value) => handleFilterChange("assessor", value)}
              disabled={loadingTrainers}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_FILTER_VALUE}>All</SelectItem>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 w-full">
            <label className="text-sm font-medium">Search</label>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by learner name, ULN, course, or trainer..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-10"
                />
                {searchKeyword && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => {
                      setSearchKeyword("");
                      setCurrentPage(1);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={clearFilters} className="h-10 whitespace-nowrap">
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <Button 
              onClick={exportToCSV} 
              disabled={!filteredData || filteredData.length === 0} 
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Failed to load data. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground font-medium">
                          No data available in table
                        </p>
                        <p className="text-sm text-muted-foreground">
                          No gateway records found matching the current filters.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <DataTablePagination
            table={table}
            manualPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Summary */}
        {filteredData.length > 0 && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

