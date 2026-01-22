"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetTimeLogExportMutation } from "@/store/api/time-log/timeLogApi";
import { useCachedUsersByRole } from "@/store/hooks/useCachedUsersByRole";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import type { User } from "@/store/api/user/types";
import type { Course } from "@/store/api/course/types";
import { exportTimelogToCSV, downloadCSV, generateTimelogFilename } from "../utils/csv-export";
import { toast } from "sonner";

interface FilterData {
  primaryAssessor: string;
  employer: string;
  course: string;
  curriculumManager: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  showOnlyOffTheJob: boolean;
}

const curriculumManagers = [
  { id: "1", name: "Emma Davis" },
  { id: "2", name: "Robert Brown" },
  { id: "3", name: "Lisa Anderson" },
];

export function TimelogExportFilters() {
  const [filters, setFilters] = useState<FilterData>({
    primaryAssessor: "",
    employer: "",
    course: "",
    curriculumManager: "",
    dateFrom: undefined,
    dateTo: undefined,
    showOnlyOffTheJob: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch dropdown data using cached hooks
  const { data: adminUsers, isLoading: loadingAdmins } = useCachedUsersByRole("Admin");
  const { data: employerUsers, isLoading: loadingEmployers } = useCachedUsersByRole("Employer");
  const { data: coursesData, isLoading: loadingCourses } = useCachedCoursesList();

  const [getTimeLogExport, { isLoading: isTimelogLoading }] = useGetTimeLogExportMutation();

  // Transform API data for dropdowns
  const primaryAssessors =
    adminUsers?.data?.map((user: User) => ({
      id: user.user_id?.toString() || "",
      name: user.user_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown",
    })) || [];

  const employers =
    employerUsers?.data?.map((user: User & { employer?: { employer_name?: string } }) => ({
      id: user.user_id?.toString() || "",
      name: user.employer?.employer_name || "Unknown",
    })) || [];

  const courses =
    coursesData?.data?.map((course: Course) => ({
      id: course.course_id?.toString() || "",
      name: course.course_name || "Unknown",
    })) || [];

  const handleFilterChange = (field: keyof FilterData, value: string | Date | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleClearFilters = () => {
    setFilters({
      primaryAssessor: "",
      employer: "",
      course: "",
      curriculumManager: "",
      dateFrom: undefined,
      dateTo: undefined,
      showOnlyOffTheJob: false,
    });
    setError(null);
  };

  const handleExportToCSV = async () => {
    try {
      setExporting(true);
      setError(null);

      // Validate date range
      if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
        setError('Date "From" cannot be later than date "To"');
        setExporting(false);
        return;
      }

      // Prepare API request
      const exportParams: {
        trainer_id?: string;
        course_id?: string;
        date_from?: string;
        date_to?: string;
        type?: string;
      } = {};
      if (filters.primaryAssessor) {
        exportParams.trainer_id = filters.primaryAssessor;
      }
      if (filters.course) {
        exportParams.course_id = filters.course;
      }
      if (filters.dateFrom) {
        exportParams.date_from = filters.dateFrom.toISOString().split("T")[0];
      }
      if (filters.dateTo) {
        exportParams.date_to = filters.dateTo.toISOString().split("T")[0];
      }
      if (filters.showOnlyOffTheJob) {
        exportParams.type = "Off the job";
      }

      // Call the API mutation
      const result = await getTimeLogExport(exportParams).unwrap();

      if (result.data && result.data.length > 0) {
        // Export the data to CSV
        const csvContent = exportTimelogToCSV(result.data);
        const filename = generateTimelogFilename();
        downloadCSV(csvContent, filename);

        toast.success("Timelog data exported successfully!");
      } else {
        setError("No data found for the selected filters.");
      }
    } catch (err: unknown) {
      console.error("Export error:", err);
      const errorMessage =
        (err as { data?: { error?: string; message?: string }; message?: string })?.data?.error ||
        (err as { data?: { error?: string; message?: string }; message?: string })?.data?.message ||
        (err as { data?: { error?: string; message?: string }; message?: string })?.message ||
        "An error occurred while exporting data. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const isLoading = loadingAdmins || loadingEmployers || loadingCourses;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Options</CardTitle>
        <CardDescription>Select filters to narrow down the timelog data for export</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filter Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Primary Assessor (Admin) */}
          <div className="space-y-2">
            <Label htmlFor="primary-assessor">By Admin</Label>
            <select
              id="primary-assessor"
              value={filters.primaryAssessor}
              onChange={(e) => handleFilterChange("primaryAssessor", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Please Select</option>
              {primaryAssessors.map((assessor) => (
                <option key={assessor.id} value={assessor.id}>
                  {assessor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employer */}
          <div className="space-y-2">
            <Label htmlFor="employer">By Employer</Label>
            <select
              id="employer"
              value={filters.employer}
              onChange={(e) => handleFilterChange("employer", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Please Select</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div className="space-y-2">
            <Label htmlFor="course">By Course</Label>
            <select
              id="course"
              value={filters.course}
              onChange={(e) => handleFilterChange("course", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Please Select</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Curriculum Manager */}
          <div className="space-y-2">
            <Label htmlFor="curriculum-manager">By Curriculum Manager</Label>
            <select
              id="curriculum-manager"
              value={filters.curriculumManager}
              onChange={(e) => handleFilterChange("curriculumManager", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Please Select</option>
              {curriculumManagers.map((cm) => (
                <option key={cm.id} value={cm.id}>
                  {cm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>Date Range From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => handleFilterChange("dateFrom", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label>Date Range To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => handleFilterChange("dateTo", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Off the Job Checkbox */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="off-the-job"
                checked={filters.showOnlyOffTheJob}
                onCheckedChange={(checked) => handleFilterChange("showOnlyOffTheJob", checked)}
              />
              <Label
                htmlFor="off-the-job"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show only Off the Job Records
              </Label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={exporting || isTimelogLoading}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
          <Button
            onClick={handleExportToCSV}
            disabled={exporting || isTimelogLoading}
            className="w-full sm:w-auto"
          >
            {(exporting || isTimelogLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {(exporting || isTimelogLoading) ? "Exporting..." : "Export to CSV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

