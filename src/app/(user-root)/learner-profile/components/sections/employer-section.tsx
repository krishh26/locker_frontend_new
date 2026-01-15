"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface EmployerSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function EmployerSection({ learner, canEdit = false }: EmployerSectionProps) {
  const form = useFormContext();
  const employerId = (learner as { employer_id?: number }).employer_id;
  const employer = (learner as { employer?: { employer_id: number; employer_name: string } }).employer;
  const jobTitle = (learner as { job_title?: string }).job_title || "-";
  const location = (learner as { location?: string }).location || "-";
  const managerName = (learner as { manager_name?: string }).manager_name || "-";
  const managerJobTitle = (learner as { manager_job_title?: string }).manager_job_title || "-";
  const mentor = (learner as { mentor?: string }).mentor || "-";

  const employerName = employer?.employer_name || (employerId ? `Employer ID: ${employerId}` : "-");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Employer</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("employer_id")}
                  className="min-h-10"
                  placeholder="Employer ID"
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
            <Label className="text-sm font-medium">Job Title</Label>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
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
            <Label className="text-sm font-medium">Manager Name</Label>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Manager Job Title</Label>
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
            <Label className="text-sm font-medium">Mentor</Label>
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
