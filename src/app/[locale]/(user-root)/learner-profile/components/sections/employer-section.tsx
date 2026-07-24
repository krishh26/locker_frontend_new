"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmployerAutocomplete } from "@/components/ui/employer-autocomplete";
import type { LearnerData } from "@/store/api/learner/types";

interface EmployerSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function EmployerSection({ learner, canEdit = false }: EmployerSectionProps) {
  const t = useTranslations("learnerProfile");
  const form = useFormContext();
  const employer = (learner as { employer?: { employer_id: number; employer_name: string } }).employer;
  const jobTitle = (learner as { job_title?: string }).job_title || "-";
  const location = (learner as { location?: string }).location || "-";
  const managerName = (learner as { manager_name?: string }).manager_name || "-";
  const managerJobTitle = (learner as { manager_job_title?: string }).manager_job_title || "-";
  const mentor = (learner as { mentor?: string }).mentor || "-";

  const employerName = employer?.employer_name || "-";

  const additionalEmployers = useMemo(() => {
    if (employer?.employer_id && employer?.employer_name) {
      return [employer];
    }
    return [];
  }, [employer]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">{t("sections.employer.title")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.employer")}</Label>
            {canEdit ? (
              <>
                <Controller
                  name="employer_id"
                  control={form.control}
                  render={({ field }) => (
                    <EmployerAutocomplete
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      placeholder={t("sections.employer.employerPlaceholder")}
                      searchPlaceholder={t("sections.employer.searchEmployers")}
                      loadingLabel={t("sections.employer.loadingEmployers")}
                      emptyLabel={t("sections.employer.noEmployersAvailable")}
                      noResultsLabel={t("sections.employer.noEmployersFound")}
                      additionalEmployers={additionalEmployers}
                      error={!!form.formState.errors.employer_id}
                    />
                  )}
                />
                {form.formState.errors.employer_id && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.employer_id.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {employerName}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.jobTitle")}</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("job_title")}
                  className="min-h-10"
                />
                {form.formState.errors.job_title && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.job_title.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {jobTitle}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.location")}</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("location")}
                  className="min-h-10"
                />
                {form.formState.errors.location && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.location.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {location}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.managerName")}</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("manager_name")}
                  className="min-h-10"
                />
                {form.formState.errors.manager_name && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.manager_name.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {managerName}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.managerJobTitle")}</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("manager_job_title")}
                  className="min-h-10"
                />
                {form.formState.errors.manager_job_title && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.manager_job_title.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {managerJobTitle}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("sections.employer.mentor")}</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("mentor")}
                  className="min-h-10"
                />
                {form.formState.errors.mentor && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.mentor.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {mentor}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
