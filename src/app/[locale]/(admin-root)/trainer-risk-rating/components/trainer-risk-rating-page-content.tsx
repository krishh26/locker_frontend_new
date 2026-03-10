"use client";

import { useState, useEffect, useMemo } from "react";
import { FileBarChart, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTranslations } from "next-intl";
import { TrainerList } from "./trainer-list";
import { RiskSettingsSection } from "./risk-settings-section";
import { CoursesTable } from "./courses-table";
import { AssessmentMethodsTable } from "./assessment-methods-table";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCachedUsersByRole } from "@/store/hooks/useCachedUsersByRole";
import { useGetTrainerDetailsQuery } from "@/store/api/trainer-risk-rating/trainerRiskRatingApi";
import type { User } from "@/store/api/user/types";

export function TrainerRiskRatingPageContent() {
  const t = useTranslations("trainerRiskRating");
  const riskOptions = useMemo(
    () => [
      { value: "Please select", label: t("riskOptions.pleaseSelect") },
      { value: "Low", label: t("riskOptions.low"), color: "success" },
      { value: "Medium", label: t("riskOptions.medium"), color: "warning" },
      { value: "High", label: t("riskOptions.high"), color: "error" },
    ] as const,
    [t]
  );
  const assessmentMethods = useMemo(
    () => [
      { value: "pe", label: t("assessmentMethods.pe"), fullName: t("assessmentMethods.peFullName") },
      { value: "do", label: t("assessmentMethods.do"), fullName: t("assessmentMethods.doFullName") },
      { value: "wt", label: t("assessmentMethods.wt"), fullName: t("assessmentMethods.wtFullName") },
      { value: "qa", label: t("assessmentMethods.qa"), fullName: t("assessmentMethods.qaFullName") },
      { value: "ps", label: t("assessmentMethods.ps"), fullName: t("assessmentMethods.psFullName") },
      { value: "di", label: t("assessmentMethods.di"), fullName: t("assessmentMethods.diFullName") },
      { value: "si", label: t("assessmentMethods.si"), fullName: t("assessmentMethods.siFullName") },
      { value: "ee", label: t("assessmentMethods.ee"), fullName: t("assessmentMethods.eeFullName") },
      { value: "ba", label: t("assessmentMethods.ba"), fullName: t("assessmentMethods.baFullName") },
      { value: "ot", label: t("assessmentMethods.ot"), fullName: t("assessmentMethods.otFullName") },
      { value: "ipl", label: t("assessmentMethods.ipl"), fullName: t("assessmentMethods.iplFullName") },
      { value: "lo", label: t("assessmentMethods.lo"), fullName: t("assessmentMethods.loFullName") },
    ] as const,
    [t]
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [riskSettings, setRiskSettings] = useState({
    high: "",
    medium: "",
    low: "",
  });
  const [riskSettingsErrors, setRiskSettingsErrors] = useState({
    high: "",
    medium: "",
    low: "",
    general: "",
  });
  const [courseRatings, setCourseRatings] = useState<{ [key: number]: string }>({});
  const [assessmentRiskRating, setAssessmentRiskRating] = useState<{
    [key: string]: string;
  }>({});

  // Fetch trainers
  const { data: trainersData, isLoading: isLoadingTrainers } = useCachedUsersByRole("Trainer");
  const trainers = trainersData?.data || [];

  // Fetch trainer details
  const { data: trainerDetails, isLoading: isLoadingDetails, refetch: refetchTrainerDetails } = useGetTrainerDetailsQuery(
    selectedUser?.user_id || 0,
    { skip: !selectedUser }
  );

  const courses = trainerDetails?.data?.courses || [];

  // Initialize state from API data
  useEffect(() => {
    if (trainerDetails?.data) {
      const data = trainerDetails.data;

      // Initialize risk settings
      if (data.risk_rating_info?.high_percentage) {
        setRiskSettings({
          high: String(data.risk_rating_info.high_percentage || ""),
          medium: String(data.risk_rating_info.medium_percentage || ""),
          low: String(data.risk_rating_info.low_percentage || ""),
        });
      }

      // Initialize assessment methods
      if (data.risk_rating_info?.assessment_methods) {
        const updated: { [key: string]: string } = {};
        Object.keys(data.risk_rating_info.assessment_methods).forEach((key) => {
          const method = data.risk_rating_info.assessment_methods[key];
          updated[method.assessment_method] =
            method.risk_level === "" ? "Please select" : method.risk_level;
        });
        setAssessmentRiskRating(updated);
      }

      // Initialize course ratings and comments
      if (data.courses) {
        const updatedRatings: { [key: number]: string } = {};
        const updatedComments: { [key: number]: string } = {};
        data.courses.forEach((course, index) => {
          updatedRatings[course.course_id] =
            course.risk_rating.overall_risk_level === ""
              ? "Please select"
              : course.risk_rating.overall_risk_level;
          if (course.comment) {
            updatedComments[index] = course.comment;
          }
        });
        setCourseRatings(updatedRatings);
        setComments(updatedComments);
      }
    }
  }, [trainerDetails]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setExpandedRow(null);
    setCourseRatings({});
    setAssessmentRiskRating({});
    setComments({});
    setRiskSettings({ high: "", medium: "", low: "" });
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={FileBarChart}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trainer List Sidebar */}
        <div className="lg:col-span-3">
          <TrainerList
            trainers={trainers}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            isLoading={isLoadingTrainers}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {selectedUser ? (
            <div className="space-y-6">
              {/* Trainer Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-md">
                      <AvatarImage
                        src={selectedUser.avatar?.url || ""}
                        alt={selectedUser.first_name}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-lg">
                        {selectedUser.first_name[0]}
                        {selectedUser.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {selectedUser.first_name} {selectedUser.last_name}
                      </h2>
                      <p className="text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  {isLoadingDetails && (
                    <div className="flex justify-center p-4">
                      <Skeleton className="h-8 w-64" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Settings */}
              <RiskSettingsSection
                riskSettings={riskSettings}
                riskSettingsErrors={riskSettingsErrors}
                onRiskSettingsChange={setRiskSettings}
                onRiskSettingsErrorsChange={setRiskSettingsErrors}
                trainerId={selectedUser.user_id}
                courses={courses}
                courseRatings={courseRatings}
                onSaveSuccess={() => {
                  refetchTrainerDetails();
                }}
              />

              {/* Courses Table */}
              <CoursesTable
                courses={courses}
                courseRatings={courseRatings}
                comments={comments}
                expandedRow={expandedRow}
                riskOptions={[...riskOptions]}
                onRatingChange={setCourseRatings}
                onCommentChange={setComments}
                onExpandedRowChange={setExpandedRow}
                trainerId={trainerDetails?.data?.risk_rating_info?.id}
                trainerUserId={selectedUser.user_id}
                onSaveSuccess={() => {
                  refetchTrainerDetails();
                }}
              />

              {/* Assessment Methods Table */}
              <AssessmentMethodsTable
                assessmentMethods={assessmentMethods}
                assessmentRiskRating={assessmentRiskRating}
                riskOptions={[...riskOptions]}
                onRatingChange={setAssessmentRiskRating}
                trainerId={selectedUser.user_id}
                onSaveSuccess={() => {
                  refetchTrainerDetails();
                }}
              />
            </div>
          ) : (
            <Card className="border-border border-dashed">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-sm">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t("selectTrainer")}</h3>
                  <p className="text-muted-foreground">
                    {t("selectTrainerDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

