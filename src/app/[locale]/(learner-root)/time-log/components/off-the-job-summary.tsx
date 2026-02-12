"use client";

import { Info, AlertTriangle, Clock, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetOtjSummaryQuery } from "@/store/api/time-log/timeLogApi";
import { useAppSelector } from "@/store/hooks";

interface OffTheJobSummaryProps {
  courseId?: string | number | null;
}

export function OffTheJobSummary({ courseId = null }: OffTheJobSummaryProps) {
  const user = useAppSelector((state) => state.auth.user);
  const learnerId =
    (user as { learner_id?: string })?.learner_id || user?.id || "";

  const { data: summaryResponse, isLoading } = useGetOtjSummaryQuery(
    {
      learner_id: learnerId,
      courseId,
      includeUnverified: true,
    },
    {
      skip: !learnerId,
    }
  );

  const summaryData = summaryResponse?.data;

  // Format minutes to hours:minutes string
  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  // Format hours to hours:minutes string
  const formatHoursToTime = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading summary...</div>
      </div>
    );
  }

  if (!summaryData) {
    return null;
  }

  // Format duration weeks (round to 2 decimal places)
  const formattedDuration = summaryData.durationWeeks
    ? (Math.round(summaryData.durationWeeks * 100) / 100).toFixed(0)
    : "0";

  // Calculate percentage if we have required to date
  const actualPercentage =
    summaryData.requiredToDate &&
    summaryData.requiredToDate > 0 &&
    summaryData.totalLoggedHours !== undefined
      ? (
          Math.round(
            (summaryData.totalLoggedHours / summaryData.requiredToDate) *
              100 *
              100
          ) / 100
        ).toFixed(2)
      : null;

  return (
    <div className="w-full mb-8 space-y-6">
      {/* Header Card */}
      <div className="rounded-t-lg border border-b-0 bg-primary/10 p-4">
        <h3 className="text-2xl font-semibold">Off the Job Summary</h3>
      </div>

      {/* Main Content Card */}
      <div className="rounded-b-lg border border-t-0">
        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div>
            <h4 className="text-xl font-semibold mb-4">Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Duration Card */}
              <Card className="p-4 border-l-4 border-l-primary bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-secondary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Calculated from earliest course start date to latest
                          course end date. Statutory leave has been deducted from
                          the total duration.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold">{formattedDuration} weeks</p>
              </Card>

              {/* Contracted Work Hours Card */}
              <Card className="p-4 border-l-4 border-l-secondary bg-secondary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Contracted Work Hours
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-secondary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Contracted work hours per week are not set. Please
                          configure this in the Contract Work Hours section.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold">N/A</p>
              </Card>

              {/* Holiday Entitlement Card */}
              <Card className="p-4 border-l-4 border-l-primary bg-primary/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Holiday Entitlement
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-secondary cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Holiday entitlement is not set. Please configure this
                          in the Contract Work Hours section.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold">N/A</p>
              </Card>

              {/* Off the Job Hours Required Card */}
              <Card className="p-4 border-l-4 border-l-accent bg-accent/10">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">
                    Off the Job Hours Required
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {summaryData.otjRequired !== undefined
                    ? `${summaryData.otjRequired.toFixed(0)} hours`
                    : "N/A"}
                </p>
              </Card>

              {/* Off the Job Hours Required to Date Card */}
              <Card className="p-4 border-l-4 border-l-secondary bg-secondary/10">
                <div className="mb-2">
                  <span className="text-sm text-muted-foreground">
                    Required to Date
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {summaryData.requiredToDate !== undefined
                    ? `${summaryData.requiredToDate.toFixed(0)} hours`
                    : "N/A"}
                </p>
              </Card>
            </div>
          </div>

          {/* Warnings Section */}
          {summaryData.warnings && summaryData.warnings.length > 0 && (
            <Card className="border-secondary bg-secondary/10">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-secondary mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold mb-2">Warnings</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {summaryData.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Actual Hours Section */}
          <div>
            <h4 className="text-xl font-semibold mb-4">Actual Hours To Date</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Logged Hours Card */}
              <Card className="p-5 bg-primary/10 border-primary/30">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Logged Hours
                  </span>
                </div>
                <p className="text-xl font-bold text-primary mb-1">
                  {summaryData.totalLoggedHours !== undefined
                    ? `${summaryData.totalLoggedHours.toFixed(2)} hours`
                    : "N/A"}
                </p>
                {summaryData.totalLoggedHours !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    ({formatHoursToTime(summaryData.totalLoggedHours)})
                  </p>
                )}
              </Card>

              {/* Hours This Week Card */}
              {summaryData.hoursThisWeek !== undefined && (
                <Card className="p-5 bg-accent/10 border-accent/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Hours This Week
                    </span>
                  </div>
                  <p className="text-xl font-bold text-accent mb-1">
                    {summaryData.hoursThisWeek.toFixed(2)} hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatHoursToTime(summaryData.hoursThisWeek)})
                  </p>
                </Card>
              )}

              {/* Hours This Month Card */}
              {summaryData.hoursThisMonth !== undefined && (
                <Card className="p-5 bg-primary/10 border-primary/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Hours This Month
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary mb-1">
                    {summaryData.hoursThisMonth.toFixed(2)} hours
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatHoursToTime(summaryData.hoursThisMonth)})
                  </p>
                </Card>
              )}

              {/* Percentage Card */}
              <Card className="p-5 bg-secondary/10 border-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Percentage To Date
                  </span>
                  {actualPercentage === null && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-secondary cursor-help ml-auto" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Percentage cannot be calculated because there are no
                            required hours to date. This may occur if the
                            apprenticeship has not started yet or if there is
                            insufficient data.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xl font-bold text-secondary">
                  {actualPercentage !== null ? `${actualPercentage}%` : "N/A"}
                </p>
              </Card>
            </div>
          </div>

          {/* Course List Table */}
          {summaryData.courseSummaries &&
            summaryData.courseSummaries.length > 0 && (
              <div>
                <h4 className="text-xl font-semibold mb-4">
                  Course List and Summary
                </h4>
                <Card className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Course</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          Off the Job Hours
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryData.courseSummaries.map((course, index) => {
                        const totalMinutes =
                          (course.offTheJobHours || 0) * 60 +
                          (course.offTheJobMinutes || 0);
                        return (
                          <TableRow
                            key={course.course_id || index}
                            className="hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {course.course_name}
                            </TableCell>
                            <TableCell>
                              {course.course_type ? (
                                <Badge variant="outline" className="text-xs">
                                  {course.course_type}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {course.status ? (
                                <Badge
                                  variant={
                                    course.status.toLowerCase() === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    course.status.toLowerCase() === "active"
                                      ? "bg-accent/10 text-accent"
                                      : ""
                                  }
                                >
                                  {course.status}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatMinutesToTime(totalMinutes)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
