"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface AdditionalInfoSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function AdditionalInfoSection({ learner, canEdit = false }: AdditionalInfoSectionProps) {
  const form = useFormContext();
  const costCentre = (learner as { cost_centre?: string }).cost_centre || "-";
  const fundingContractor = (learner as { funding_contractor?: string }).funding_contractor || "-";
  const partner = (learner as { partner?: string }).partner || "-";
  const subArea = (learner as { sub_area?: string }).sub_area || "-";
  const cohort = (learner as { cohort?: string }).cohort || "-";
  const curriculumArea = (learner as { curriculum_area?: string }).curriculum_area || "-";
  const ssa1 = (learner as { ssa1?: string }).ssa1 || "-";
  const ssa2 = (learner as { ssa2?: string }).ssa2 || "-";
  const directorOfCurriculum = (learner as { director_of_curriculum?: string }).director_of_curriculum || "-";
  const learnerType = (learner as { learner_type?: string }).learner_type || "-";
  const expectedOffTheJobHours = (learner as { expected_off_the_job_hours?: string | number }).expected_off_the_job_hours || "-";
  const offTheJobTraining = (learner as { off_the_job_training?: string }).off_the_job_training || "-";
  const guidedLearningHoursAchieved = (learner as { guided_learning_hours_achieved?: string | number }).guided_learning_hours_achieved || "-";

  // Only show section if there's at least one field with data
  const hasData = [
    costCentre,
    fundingContractor,
    partner,
    subArea,
    cohort,
    curriculumArea,
    ssa1,
    ssa2,
    directorOfCurriculum,
    learnerType,
    expectedOffTheJobHours,
    offTheJobTraining,
    guidedLearningHoursAchieved,
  ].some((value) => value && value !== "-");

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cost Centre</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("cost_centre")}
                  className="min-h-10"
                />
                {form.formState.errors.cost_centre && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.cost_centre.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {costCentre}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Funding Contractor</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("funding_contractor")}
                  className="min-h-10"
                />
                {form.formState.errors.funding_contractor && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.funding_contractor.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {fundingContractor}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Partner</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("partner")}
                  className="min-h-10"
                />
                {form.formState.errors.partner && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.partner.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {partner}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sub Area</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("sub_area")}
                  className="min-h-10"
                />
                {form.formState.errors.sub_area && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.sub_area.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {subArea}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cohort</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("cohort")}
                  className="min-h-10"
                />
                {form.formState.errors.cohort && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.cohort.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {cohort}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Curriculum Area</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("curriculum_area")}
                  className="min-h-10"
                />
                {form.formState.errors.curriculum_area && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.curriculum_area.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {curriculumArea}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">SSA1</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("ssa1")}
                  className="min-h-10"
                />
                {form.formState.errors.ssa1 && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.ssa1.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {ssa1}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">SSA2</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("ssa2")}
                  className="min-h-10"
                />
                {form.formState.errors.ssa2 && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.ssa2.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {ssa2}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Director of Curriculum</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("director_of_curriculum")}
                  className="min-h-10"
                />
                {form.formState.errors.director_of_curriculum && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.director_of_curriculum.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {directorOfCurriculum}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Learner Type</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("learner_type")}
                  className="min-h-10"
                />
                {form.formState.errors.learner_type && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.learner_type.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {learnerType}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expected Off the Job Hours</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("expected_off_the_job_hours")}
                  className="min-h-10"
                />
                {form.formState.errors.expected_off_the_job_hours && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.expected_off_the_job_hours.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {expectedOffTheJobHours}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Off the Job Training</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("off_the_job_training")}
                  className="min-h-10"
                />
                {form.formState.errors.off_the_job_training && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.off_the_job_training.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {offTheJobTraining}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Guided Learning Hours Achieved</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("guided_learning_hours_achieved")}
                  className="min-h-10"
                />
                {form.formState.errors.guided_learning_hours_achieved && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.guided_learning_hours_achieved.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {guidedLearningHoursAchieved}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

