"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
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
  lineManager: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  showOnlyOffTheJob: boolean;
}

export function TimelogExportFilters() {
  const t = useTranslations("timelogExport");

  const [filters, setFilters] = useState<FilterData>({
    primaryAssessor: "",
    employer: "",
    course: "",
    lineManager: "",
    dateFrom: undefined,
    dateTo: undefined,
    showOnlyOffTheJob: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch dropdown data using cached hooks
  const { data: adminUsers, isLoading: loadingAdmins } = useCachedUsersByRole("Admin");
  const { data: employerUsers, isLoading: loadingEmployers } = useCachedUsersByRole("Employer");
  const { data: lineManagerUsers, isLoading: loadingLineManagers } = useCachedUsersByRole("Line Manager");
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

  const lineManagers =
    lineManagerUsers?.data?.map((user: User) => ({
      id: user.user_id?.toString() || "",
      name: user.user_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown",
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
      lineManager: "",
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
        setError(t("filters.errorInvalidDateRange"));
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

        toast.success(t("filters.toastExportSuccess"));
      } else {
        setError(t("filters.noDataFound"));
      }
    } catch (err: unknown) {
      console.error("Export error:", err);
      const errorMessage =
        (err as { data?: { error?: string; message?: string }; message?: string })?.data?.error ||
        (err as { data?: { error?: string; message?: string }; message?: string })?.data?.message ||
        (err as { data?: { error?: string; message?: string }; message?: string })?.message ||
        t("filters.genericError");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const isLoading = loadingAdmins || loadingEmployers || loadingLineManagers || loadingCourses;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("filters.cardTitle")}</CardTitle>
        <CardDescription>{t("filters.cardDescription")}</CardDescription>
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
            <Label htmlFor="primary-assessor">{t("filters.filterByAdminLabel")}</Label>
            <select
              id="primary-assessor"
              value={filters.primaryAssessor}
              onChange={(e) => handleFilterChange("primaryAssessor", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">{t("filters.pleaseSelectOption")}</option>
              {primaryAssessors.map((assessor) => (
                <option key={assessor.id} value={assessor.id}>
                  {assessor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employer */}
          <div className="space-y-2">
            <Label htmlFor="employer">{t("filters.filterByEmployerLabel")}</Label>
            <select
              id="employer"
              value={filters.employer}
              onChange={(e) => handleFilterChange("employer", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">{t("filters.pleaseSelectOption")}</option>
              {employers.map((employer) => (
                <option key={employer.id} value={employer.id}>
                  {employer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div className="space-y-2">
            <Label htmlFor="course">{t("filters.filterByCourseLabel")}</Label>
            <select
              id="course"
              value={filters.course}
              onChange={(e) => handleFilterChange("course", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">{t("filters.pleaseSelectOption")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Line Manager */}
          <div className="space-y-2">
            <Label htmlFor="line-manager">{t("filters.filterByLineManagerLabel")}</Label>
            <select
              id="line-manager"
              value={filters.lineManager}
              onChange={(e) => handleFilterChange("lineManager", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">{t("filters.pleaseSelectOption")}</option>
              {lineManagers.map((lm) => (
                <option key={lm.id} value={lm.id}>
                  {lm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label>{t("filters.dateFromLabel")}</Label>
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
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : <span>{t("filters.pickDatePlaceholder")}</span>}
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
            <Label>{t("filters.dateToLabel")}</Label>
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
                  {filters.dateTo ? format(filters.dateTo, "PPP") : <span>{t("filters.pickDatePlaceholder")}</span>}
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
                {t("filters.showOnlyOffTheJobLabel")}
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
            {t("filters.clearButton")}
          </Button>
          <Button
            onClick={handleExportToCSV}
            disabled={exporting || isTimelogLoading}
            className="w-full sm:w-auto"
          >
            {(exporting || isTimelogLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {(exporting || isTimelogLoading) ? t("filters.exportingLabel") : t("filters.exportCsvButton")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

