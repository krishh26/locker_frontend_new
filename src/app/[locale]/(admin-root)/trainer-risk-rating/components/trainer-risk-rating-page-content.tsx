"use client";

import { useState, useEffect } from "react";
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

const riskOptions = [
  { value: "Please select", label: "Please select" },
  { value: "Low", label: "Low", color: "success" },
  { value: "Medium", label: "Medium", color: "warning" },
  { value: "High", label: "High", color: "error" },
] as const;

const assessmentMethods = [
  { value: "pe", label: "PE", fullName: "Professional Discussion" },
  { value: "do", label: "DO", fullName: "Direct Observation" },
  { value: "wt", label: "WT", fullName: "Witness Testimony" },
  { value: "qa", label: "QA", fullName: "Question and Answer" },
  { value: "ps", label: "PS", fullName: "Product Sample" },
  { value: "di", label: "DI", fullName: "Discussion" },
  { value: "si", label: "SI", fullName: "Simulation" },
  { value: "ee", label: "ET", fullName: "Expert Evidence" },
  { value: "ba", label: "RA", fullName: "Basic Assessment" },
  { value: "ot", label: "OT", fullName: "Other" },
  { value: "ipl", label: "RPL", fullName: "Individual Personal Log" },
  { value: "lo", label: "LO", fullName: "Learning Outcome" },
] as const;

export function TrainerRiskRatingPageContent() {
  const t = useTranslations("trainerRiskRating");
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
              <Card className="bg-linear-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/50 dark:to-violet-950/40 border-indigo-300/60 dark:border-indigo-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-2 ring-indigo-300/60 dark:ring-indigo-700/40 shadow-md">
                      <AvatarImage
                        src={selectedUser.avatar?.url || ""}
                        alt={selectedUser.first_name}
                      />
                      <AvatarFallback className="bg-linear-to-br from-indigo-400 to-violet-500 dark:from-indigo-500 dark:to-violet-600 text-white font-semibold text-lg">
                        {selectedUser.first_name[0]}
                        {selectedUser.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">
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
            <Card className="bg-linear-to-br from-slate-50/80 to-gray-50/80 dark:from-slate-950/40 dark:to-gray-950/30 border-dashed border-primary/30">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/30 flex items-center justify-center mb-4 shadow-sm">
                    <UserIcon className="h-10 w-10 text-sky-600 dark:text-sky-400" />
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

