"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { CourseUnit } from "@/store/api/skills-scan/types";
import { useAppSelector } from "@/store/hooks";
import { selectCourseData, selectSelectedCourse } from "@/store/slices/skillsScanSlice";
import html2canvas from "html2canvas-pro";
import { Download, Eye, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  SkillsScanProgressChart,
  getUnitChartSeries,
} from "./skills-scan-progress-chart";
import { useTranslations } from "next-intl";
import { ratesUnitDirectly } from "../utils/rating-target";

export function SkillsScanViewResults() {
  const t = useTranslations("skillsScan");
  const selectedCourse = useAppSelector(selectSelectedCourse);
  const courseData = useAppSelector(selectCourseData);
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Extract course_core_type handling both structures
  const courseCoreType = courseData?.course?.course_core_type || courseData?.course_core_type;
  const isStandardType = courseCoreType === "Standard";

  const units = useMemo(() => {
    // Handle both response structures: with course wrapper or direct units
    if (courseData?.course?.units) {
      return courseData.course.units;
    }
    if (courseData?.units) {
      return courseData.units;
    }
    return [];
  }, [courseData]);

  const totalSkills = useMemo(() => {
    return units.reduce((sum: number, unit: CourseUnit) => {
      // Standard units without KSB criteria count as 1 skill; otherwise count subUnits
      if (ratesUnitDirectly(unit, isStandardType)) {
        return sum + 1;
      }
      return sum + (unit.subUnit?.length || 0);
    }, 0);
  }, [units, isStandardType]);

  const completedSkills = useMemo(() => {
    return units.reduce((sum: number, unit: CourseUnit) => {
      // Standard units without KSB criteria: check the unit's quarter_review
      if (ratesUnitDirectly(unit, isStandardType)) {
        const isCompleted =
          unit.quarter_review?.induction &&
          unit.quarter_review?.first &&
          unit.quarter_review?.second &&
          unit.quarter_review?.third;
        return sum + (isCompleted ? 1 : 0);
      }
      // For Qualification units or Standard units with KSB criteria, check subUnits
      const completed = unit.subUnit?.filter(
        (sub) =>
          sub.quarter_review?.induction &&
          sub.quarter_review?.first &&
          sub.quarter_review?.second &&
          sub.quarter_review?.third
      ).length || 0;
      return sum + completed;
    }, 0);
  }, [units, isStandardType]);

  const selectedUnit = useMemo(
    () => units.find((unit: CourseUnit) => unit.title === selectedTopic),
    [units, selectedTopic]
  );

  // Same series (codes + colours) the chart draws, so the legend matches the lines.
  const legendSeries = useMemo(
    () => getUnitChartSeries(selectedUnit, isStandardType),
    [selectedUnit, isStandardType]
  );

  useEffect(() => {
    if (units.length > 0 && !selectedTopic) {
      setSelectedTopic(units[0].title);
    }
  }, [units, selectedTopic]);

  const handleDownloadPdf = async () => {
    try {
      const element = document.getElementById("results-content");

      if (!element) {
        toast.error(t("results.states.contentNotFound"));
        return;
      }

      // Show loading toast
      toast.loading(t("results.toast.generatingPdf"), { id: "pdf-generating" });

      // html2canvas-pro supports oklch colors natively, so we can use it directly
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        imageTimeout: 15000,
      });

      // Browser ESM build — bare "jspdf" resolves to node build under Turbopack/SSR (fflate + Worker error).
      const { jsPDF } = await import("jspdf/dist/jspdf.es.min.js");

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename with course name and date
      const courseName = selectedCourse?.course?.course_name || "SkillsAssessment";
      const date = new Date().toISOString().split("T")[0];
      const filename = `${courseName}_Results_${date}.pdf`;

      // Save PDF
      pdf.save(filename);

      toast.success(t("results.toast.pdfDownloaded"), { id: "pdf-generating" });
    } catch (error) {
      toast.error(t("results.toast.pdfDownloadFailed"), { id: "pdf-generating" });
      console.error("PDF export error:", error);
    }
  };

  if (!selectedCourse) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Eye className="mb-4 size-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            {t("results.states.noCourse.title")}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t("results.states.noCourse.body")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if courseData is loading (managed by tna-units component)
  const isLoading = !courseData && selectedCourse;

  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">{t("results.states.loading")}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" id="results-content">
      {/* Header */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Eye className="size-6 text-primary" />
              <CardTitle>{t("results.title")}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="size-3" />
                {t("results.skillsAssessed", {
                  completed: completedSkills,
                  total: totalSkills,
                })}
              </Badge>
              <Button onClick={handleDownloadPdf} variant="default" className="gap-2">
                <Download className="size-4" />
                {t("results.buttons.downloadPdf")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
      </Card>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Chart Section */}
        <div className="flex-1">
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">{t("results.chart.title")}</CardTitle>
                {units.length > 0 && (
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-full bg-background sm:w-[250px]">
                      <SelectValue placeholder={t("results.chart.selectTopicPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit: CourseUnit) => (
                        <SelectItem key={unit.id} value={unit.title}>
                          {unit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {selectedTopic && units.length > 0 ? (
                <SkillsScanProgressChart
                  learnerData={{ units, course_core_type: courseCoreType }}
                  selectedTopic={selectedTopic}
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <p className="text-muted-foreground">{t("results.chart.noData")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend Section */}
        <Card className="w-full border shadow-sm lg:w-[300px]">
          <CardHeader className="bg-muted">
            <CardTitle className="text-base">{t("results.legend.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {selectedUnit ? (
              <div className="space-y-3">
                <h4 className="font-semibold">{selectedUnit.title}</h4>
                <ul className="space-y-2.5">
                  {legendSeries.map((s) => (
                    <li key={s.key} className="flex items-start gap-2 text-sm">
                      <span
                        className="mt-1.5 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0">
                        {s.label !== s.title && (
                          <span className="font-semibold" style={{ color: s.color }}>
                            {s.label}
                          </span>
                        )}
                        <p className="break-words text-xs leading-relaxed text-muted-foreground">
                          {s.title}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("results.chart.noData")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

