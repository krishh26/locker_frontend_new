/**
 * CourseDetailsForm Component
 * 
 * Course Details form component using React Hook Form
 * Handles form fields for all course types (Qualification, Standard, Gateway)
 */

"use client";

import { Controller, Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { useTranslations } from "next-intl";
import type { CourseFormData, CourseCoreType } from "@/store/api/course/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COURSE_TYPES,
  COURSE_LEVELS,
  AWARDING_BODY_OPTIONS,
  DURATION_PERIODS,
  YES_NO_OPTIONS_STRINGS,
  type GatewayCourse,
} from "../constants/course-constants";
import { cn } from "@/lib/utils";

interface CourseDetailsFormProps {
  control: Control<CourseFormData>;
  errors: FieldErrors<CourseFormData>;
  courseCoreType: CourseCoreType;
  gatewayCourses?: GatewayCourse[];
  setValue?: UseFormSetValue<CourseFormData>;
}

export function CourseDetailsForm({
  control,
  errors,
  courseCoreType,
  gatewayCourses = [],
  setValue,
}: CourseDetailsFormProps) {
  const t = useTranslations("courseBuilder");
  return (
    <div className="space-y-6">
      {/* Row 1: Course Name, Course Code, Course Level */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course_name">
            {t("course.form.courseName")} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="course_name"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  {...field}
                  id="course_name"
                  placeholder={t("course.form.courseNamePlaceholder")}
                  className={cn(errors.course_name && "border-destructive")}
                />
                {errors.course_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.course_name.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course_code">
            {t("course.form.courseCode")} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="course_code"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  {...field}
                  id="course_code"
                  placeholder={t("course.form.courseCodePlaceholder")}
                  className={cn(errors.course_code && "border-destructive")}
                />
                {errors.course_code && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.course_code.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">
            {t("course.form.courseLevel")} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <div>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="level"
                    className={cn("w-full", errors.level && "border-destructive")}
                  >
                    <SelectValue placeholder={t("course.form.selectCourseLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.level.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Row 2: Course Guidance (Qualification only) */}
      {courseCoreType === "Qualification" && (
        <div className="space-y-2">
          <Label htmlFor="brand_guidelines">
            {t("course.form.courseGuidance")} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="brand_guidelines"
            control={control}
            render={({ field }) => (
              <div>
                <Textarea
                  {...field}
                  id="brand_guidelines"
                  placeholder={t("course.form.courseGuidancePlaceholder")}
                  rows={4}
                  className={cn(errors.brand_guidelines && "border-destructive")}
                />
                {errors.brand_guidelines && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.brand_guidelines.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      )}

      {/* Qualification-specific fields */}
      {courseCoreType === "Qualification" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="course_type">
                {t("course.form.courseType")} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="course_type"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="course_type"
                        className={cn("w-full", errors.course_type && "border-destructive")}
                      >
                        <SelectValue placeholder={t("course.form.selectCourseType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.course_type && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.course_type.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operational_start_date">{t("course.form.operationalStartDate")}</Label>
              <Controller
                name="operational_start_date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="operational_start_date"
                    type="date"
                    className={cn(
                      errors.operational_start_date && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">{t("course.form.sector")}</Label>
              <Controller
                name="sector"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="sector"
                    placeholder={t("course.form.sectorPlaceholder")}
                    className={cn(errors.sector && "border-destructive")}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="total_credits">{t("course.form.totalCredits")}</Label>
              <Controller
                name="total_credits"
                control={control}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      id="total_credits"
                      type="number"
                      placeholder={t("course.form.totalCreditsPlaceholder")}
                      className={cn(errors.total_credits && "border-destructive")}
                    />
                    {errors.total_credits && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.total_credits.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guided_learning_hours">{t("course.form.guidedLearningHours")}</Label>
              <Controller
                name="guided_learning_hours"
                control={control}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      id="guided_learning_hours"
                      type="number"
                      placeholder={t("course.form.guidedLearningHoursPlaceholder")}
                      className={cn(
                        errors.guided_learning_hours && "border-destructive"
                      )}
                    />
                    {errors.guided_learning_hours && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.guided_learning_hours.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommended_minimum_age">{t("course.form.recommendedMinAge")}</Label>
              <Controller
                name="recommended_minimum_age"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="recommended_minimum_age"
                    type="number"
                    placeholder={t("course.form.recommendedMinAgePlaceholder")}
                    className={cn(
                      errors.recommended_minimum_age && "border-destructive"
                    )}
                  />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="overall_grading_type">{t("course.form.overallGradingType")}</Label>
              <Controller
                name="overall_grading_type"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="overall_grading_type"
                    placeholder={t("course.form.overallGradingTypePlaceholder")}
                    className={cn(
                      errors.overall_grading_type && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="awarding_body">{t("course.form.awardingBody")}</Label>
              <Controller
                name="awarding_body"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="awarding_body"
                        className={cn("w-full", errors.awarding_body && "border-destructive")}
                      >
                        <SelectValue placeholder={t("course.form.selectAwardingBody")} />
                      </SelectTrigger>
                      <SelectContent>
                        {AWARDING_BODY_OPTIONS.map((body) => (
                          <SelectItem key={body} value={body}>
                            {body}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.awarding_body && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.awarding_body.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        </>
      )}

      {/* Standard-specific fields */}
      {courseCoreType === "Standard" && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="operational_start_date">{t("course.form.expirationDate")}</Label>
              <Controller
                name="operational_start_date"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="operational_start_date"
                    type="date"
                    className={cn(
                      errors.operational_start_date && "border-destructive"
                    )}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">{t("course.form.active")}</Label>
              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={
                        field.value === true || field.value === undefined
                          ? "Yes"
                          : "No"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "Yes")
                      }
                    >
                    <SelectTrigger
                      id="active"
                      className={cn(
                        "w-full",
                        errors.active && "border-destructive"
                      )}
                    >
                        <SelectValue placeholder={t("course.form.selectActiveStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO_OPTIONS_STRINGS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.active && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.active.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="included_in_off_the_job">
                {t("course.form.includedOffTheJob")}
              </Label>
              <Controller
                name="included_in_off_the_job"
                control={control}
                render={({ field }) => (
                  <div className="w-full">
                    <Select
                      value={
                        field.value === true || field.value === undefined
                          ? "Yes"
                          : "No"
                      }
                      onValueChange={(value) =>
                        field.onChange(value === "Yes")
                      }
                    >
                      <SelectTrigger
                        id="included_in_off_the_job"
                        className={cn(
                          "w-full",
                          errors.included_in_off_the_job && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder={t("course.form.selectOption")} />
                      </SelectTrigger>
                      <SelectContent>
                        {YES_NO_OPTIONS_STRINGS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.included_in_off_the_job && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.included_in_off_the_job.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration_period">
                {t("course.form.durationOfCourse")} <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="duration_period"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="duration_period"
                        className={cn("w-full", errors.duration_period && "border-destructive")}
                      >
                        <SelectValue placeholder={t("course.form.selectDurationPeriod")} />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_PERIODS.map((period) => (
                          <SelectItem key={period} value={period}>
                            {period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.duration_period && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.duration_period.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_value">{t("course.form.durationValue")}</Label>
              <Controller
                name="duration_value"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="duration_value"
                    type="number"
                    placeholder={t("course.form.durationValuePlaceholder")}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value ? Number(e.target.value) : null)
                    }
                    className={cn(errors.duration_value && "border-destructive")}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="two_page_standard_link">{t("course.form.twoPageStandardLink")}</Label>
            <Controller
              name="two_page_standard_link"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="two_page_standard_link"
                  type="url"
                  placeholder={t("course.form.twoPageStandardLinkPlaceholder")}
                  className={cn(
                    errors.two_page_standard_link && "border-destructive"
                  )}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assessment_plan_link">{t("course.form.assessmentPlanLink")}</Label>
            <Controller
              name="assessment_plan_link"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="assessment_plan_link"
                  type="url"
                  placeholder={t("course.form.assessmentPlanLinkPlaceholder")}
                  className={cn(errors.assessment_plan_link && "border-destructive")}
                />
              )}
            />
          </div>

          {gatewayCourses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="assigned_gateway_id">{t("course.form.gatewayAssigned")}</Label>
              <Controller
                name="assigned_gateway_id"
                control={control}
                render={({ field }) => {
                  const selectedGateway = gatewayCourses.find(
                    (gateway) =>
                      gateway.course_id ===
                      (typeof field.value === "string"
                        ? parseInt(field.value)
                        : field.value)
                  );

                  return (
                    <div className="w-full">
                      <Select
                        value={selectedGateway?.course_id.toString() || ""}
                        onValueChange={(value) => {
                          const gateway = gatewayCourses.find(
                            (g) => g.course_id.toString() === value
                          );
                          field.onChange(gateway ? gateway.course_id : null);
                          // Also update assigned_gateway_name
                          if (setValue && gateway) {
                            setValue(
                              "assigned_gateway_name",
                              gateway.course_name
                            );
                          } else if (setValue) {
                            setValue("assigned_gateway_name", "");
                          }
                        }}
                      >
                        <SelectTrigger
                          id="assigned_gateway_id"
                          className={cn(
                            "w-full",
                            errors.assigned_gateway_id && "border-destructive"
                          )}
                        >
                          <SelectValue placeholder={t("course.form.selectGatewayCourse")} />
                        </SelectTrigger>
                        <SelectContent>
                          {gatewayCourses.map((gateway) => (
                            <SelectItem
                              key={gateway.course_id}
                              value={gateway.course_id.toString()}
                            >
                              {gateway.course_name} ({gateway.course_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.assigned_gateway_id && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.assigned_gateway_id.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Gateway-specific fields - minimal for now, questions handled in step component */}
      {courseCoreType === "Gateway" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("course.form.gatewayDetailsNote")}
          </p>
        </div>
      )}
    </div>
  );
}
