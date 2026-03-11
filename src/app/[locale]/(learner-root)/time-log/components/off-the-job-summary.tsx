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
import { useTranslations } from "next-intl";

interface OffTheJobSummaryProps {
  courseId?: string | number | null;
}

export function OffTheJobSummary({ courseId = null }: OffTheJobSummaryProps) {
  const user = useAppSelector((state) => state.auth.user);
  const learnerId =
    (user as { learner_id?: string })?.learner_id || user?.id || "";
  const t = useTranslations("timeLog");

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
        <div className="text-muted-foreground">
          {t("offTheJob.loading")}
        </div>
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
      <div className="rounded-t-lg border border-b-0 bg-primary p-4">
        <h3 className="text-2xl font-semibold text-white">
          {t("offTheJob.title")}
        </h3>
      </div>

      {/* Main Content Card */}
      <div className="rounded-b-lg border border-t-0">
        <div className="p-6 space-y-6">
          {/* Summary Section */}
          <div>
            <h4 className="text-xl font-semibold mb-4">
              {t("offTheJob.summarySection.title")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Duration Card */}
              <Card className="p-4 border-l-4 border-l-white bg-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">
                    {t("offTheJob.summarySection.duration.label")}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-white cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t("offTheJob.summarySection.duration.tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold text-white">
                  {formattedDuration}{" "}
                  {t("offTheJob.summarySection.duration.units", {
                    default: "weeks",
                  })}
                </p>
              </Card>

              {/* Contracted Work Hours Card */}
              <Card className="p-4 border-l-4 border-l-white bg-secondary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">
                    {t("offTheJob.summarySection.contractedHours.label")}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-white cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          {t("offTheJob.summarySection.contractedHours.tooltip")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold text-white">N/A</p>
              </Card>

              {/* Holiday Entitlement Card */}
              <Card className="p-4 border-l-4 border-l-white bg-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">
                    {t("offTheJob.summarySection.holiday.label")}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-white cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t("offTheJob.summarySection.holiday.tooltip")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-lg font-semibold text-white">N/A</p>
              </Card>

              {/* Off the Job Hours Required Card */}
              <Card className="p-4 border-l-4 border-l-white bg-accent">
                <div className="mb-2">
                  <span className="text-sm text-white/70">
                    {t("offTheJob.summarySection.required.label")}
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {summaryData.otjRequired !== undefined
                    ? `${summaryData.otjRequired.toFixed(0)} ${t(
                        "offTheJob.common.hours"
                      )}`
                    : "N/A"}
                </p>
              </Card>

              {/* Off the Job Hours Required to Date Card */}
              <Card className="p-4 border-l-4 border-l-white bg-secondary">
                <div className="mb-2">
                  <span className="text-sm text-white/70">
                    {t("offTheJob.summarySection.requiredToDate.label")}
                  </span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {summaryData.requiredToDate !== undefined
                    ? `${summaryData.requiredToDate.toFixed(0)} ${t(
                        "offTheJob.common.hours"
                      )}`
                    : "N/A"}
                </p>
              </Card>
            </div>
          </div>

          {/* Warnings Section */}
          {summaryData.warnings && summaryData.warnings.length > 0 && (
            <Card className="border-secondary bg-secondary">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-white mt-0.5" />
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold mb-2 text-white">
                      {t("offTheJob.warnings.title")}
                    </h5>
                    <ul className="list-disc list-inside space-y-1">
                      {summaryData.warnings.map((warning, index) => (
                        <li key={index} className="text-sm text-white/90">
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
            <h4 className="text-xl font-semibold mb-4">
              {t("offTheJob.actualHours.title")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Logged Hours Card */}
              <Card className="p-5 bg-primary border-primary">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium text-white/70">
                    {t("offTheJob.actualHours.totalLogged.label")}
                  </span>
                </div>
                <p className="text-xl font-bold text-white mb-1">
                  {summaryData.totalLoggedHours !== undefined
                    ? `${summaryData.totalLoggedHours.toFixed(2)} ${t(
                        "offTheJob.common.hours"
                      )}`
                    : "N/A"}
                </p>
                {summaryData.totalLoggedHours !== undefined && (
                  <p className="text-xs text-white/70">
                    ({formatHoursToTime(summaryData.totalLoggedHours)})
                  </p>
                )}
              </Card>

              {/* Hours This Week Card */}
              {summaryData.hoursThisWeek !== undefined && (
                <Card className="p-5 bg-accent border-accent">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-white" />
                    <span className="text-sm font-medium text-white/70">
                      {t("offTheJob.actualHours.thisWeek.label")}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">
                    {summaryData.hoursThisWeek.toFixed(2)}{" "}
                    {t("offTheJob.common.hours")}
                  </p>
                  <p className="text-xs text-white/70">
                    ({formatHoursToTime(summaryData.hoursThisWeek)})
                  </p>
                </Card>
              )}

              {/* Hours This Month Card */}
              {summaryData.hoursThisMonth !== undefined && (
                <Card className="p-5 bg-primary border-primary">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-white" />
                    <span className="text-sm font-medium text-white/70">
                      {t("offTheJob.actualHours.thisMonth.label")}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white mb-1">
                    {summaryData.hoursThisMonth.toFixed(2)}{" "}
                    {t("offTheJob.common.hours")}
                  </p>
                  <p className="text-xs text-white/70">
                    ({formatHoursToTime(summaryData.hoursThisMonth)})
                  </p>
                </Card>
              )}

              {/* Percentage Card */}
              <Card className="p-5 bg-secondary border-secondary">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium text-white/70">
                    {t("offTheJob.actualHours.percentage.label")}
                  </span>
                  {actualPercentage === null && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-white cursor-help ml-auto" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            {t("offTheJob.actualHours.percentage.tooltip")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-xl font-bold text-white">
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
                  {t("offTheJob.courses.title")}
                </h4>
                <Card className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">
                          {t("offTheJob.courses.columns.course")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("offTheJob.courses.columns.type")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("offTheJob.courses.columns.status")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t("offTheJob.courses.columns.offTheJobHours")}
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
                                      ? "bg-accent text-white"
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
